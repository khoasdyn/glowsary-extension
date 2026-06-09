(() => {
  const ENTRIES_KEY = "glowsaryEntries";
  const SETTINGS_KEY = "glowsarySettings";
  const EXCLUDED_SITES_KEY = "glowsaryExcludedSites";
  const DEFAULT_SETTINGS = {
    highlightingEnabled: true,
    excludedSitesEnabled: true,
    managementSort: "latest"
  };
  const HIGHLIGHT_CLASS = "glowsary-highlight";
  const POPUP_CLASS = "glowsary-popup";
  const BLOCKED_HIGHLIGHT_ANCESTORS = new Set(["A", "BUTTON", "NAV", "INPUT", "LABEL", "SELECT", "TEXTAREA"]);
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
    "BUTTON",
    "CODE",
    "PRE",
    "NOSCRIPT",
    "IFRAME",
    "SVG",
    "CANVAS"
  ]);

  let entries = [];
  let settings = { ...DEFAULT_SETTINGS };
  let excludedSites = [];
  let currentSiteDomain = null;
  let observer = null;
  let suppressMutations = false;
  let highlightTimer = 0;
  let popupCloseTimer = 0;
  let activePopup = null;
  let activeDialog = null;

  function normalizeColor(value) {
    return window.GlowsaryColorPicker?.normalizeColor?.(value) || "purple";
  }

  const storage = {
    get(keys) {
      return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
    },
    set(values) {
      return new Promise((resolve) => chrome.storage.local.set(values, resolve));
    }
  };

  function collapseSpaces(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function normalizeTerm(value) {
    return collapseSpaces(value).toLowerCase();
  }

  function normalizeAliasList(aliases = []) {
    return aliases.map((alias) => ({
      term: normalizeTerm(alias.term || alias.displayTerm || alias),
      displayTerm: collapseSpaces(alias.displayTerm || alias.term || alias)
    })).filter((alias) => alias.term && alias.displayTerm);
  }

  function normalizeEntry(entry) {
    return {
      ...entry,
      color: normalizeColor(entry.color),
      aliases: normalizeAliasList(entry.aliases)
    };
  }

  function normalizeExcludedSites(sites = []) {
    return window.GlowsaryDomains?.normalizeExcludedSites?.(sites) || [];
  }

  function normalizeSettings(rawSettings = {}) {
    return {
      highlightingEnabled: rawSettings.highlightingEnabled !== false,
      excludedSitesEnabled: rawSettings.excludedSitesEnabled !== false,
      managementSort: rawSettings.managementSort === "az" ? "az" : "latest"
    };
  }

  function isCurrentSiteExcluded() {
    return Boolean(
      currentSiteDomain &&
        settings.excludedSitesEnabled !== false &&
        excludedSites.some((site) => site.domain === currentSiteDomain)
    );
  }

  function canShowHighlights() {
    return Boolean(settings.highlightingEnabled && !isCurrentSiteExcluded());
  }

  function parseAliases(value, normalizedTerm) {
    const aliases = [];
    const seen = new Set();

    for (const rawAlias of String(value || "").split(",")) {
      const displayTerm = collapseSpaces(rawAlias);

      if (!displayTerm) {
        continue;
      }

      if (displayTerm.length < 3) {
        return { error: `Alias "${displayTerm}" must be at least 3 characters.` };
      }

      const term = normalizeTerm(displayTerm);

      if (term === normalizedTerm || seen.has(term)) {
        continue;
      }

      seen.add(term);
      aliases.push({ term, displayTerm });
    }

    return { aliases };
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function isWordChar(char) {
    return /[A-Za-z0-9_]/.test(char || "");
  }

  function isWholeWordMatch(text, start, end) {
    return !isWordChar(text[start - 1]) && !isWordChar(text[end]);
  }

  function isEditableNode(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return Boolean(element?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true'], [contenteditable='plaintext-only']"));
  }

  function hasBlockedHighlightAncestor(node) {
    let element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

    while (element) {
      if (BLOCKED_HIGHLIGHT_ANCESTORS.has(element.tagName)) {
        return true;
      }

      element = element.parentElement;
    }

    return false;
  }

  function shouldSkipTextNode(node) {
    if (!node.nodeValue.trim()) {
      return true;
    }

    const parent = node.parentElement;
    if (!parent) {
      return true;
    }

    if (SKIP_TAGS.has(parent.tagName)) {
      return true;
    }

    if (hasBlockedHighlightAncestor(node)) {
      return true;
    }

    return Boolean(
      parent.closest(
        `.${HIGHLIGHT_CLASS}, .glowsary-dialog-backdrop, .${POPUP_CLASS}, input, textarea, select, [contenteditable=''], [contenteditable='true'], [contenteditable='plaintext-only']`
      )
    );
  }

  function buildPattern(term) {
    return term
      .split(" ")
      .filter(Boolean)
      .map(escapeRegExp)
      .join("\\s+");
  }

  function findMatches(text) {
    const candidates = [];

    for (const entry of entries) {
      const sources = [
        { term: entry.term, displayTerm: entry.displayTerm, isAlias: false },
        ...normalizeAliasList(entry.aliases).map((alias) => ({ ...alias, isAlias: true }))
      ].filter((source) => source.term);

      for (const source of sources) {
        const regex = new RegExp(buildPattern(source.term), "gi");
        let match;

        while ((match = regex.exec(text)) !== null) {
          const start = match.index;
          const end = start + match[0].length;

          if (isWholeWordMatch(text, start, end)) {
            candidates.push({
              start,
              end,
              length: end - start,
              priority: source.isAlias ? 0 : 1,
              entry,
              source
            });
          }

          if (regex.lastIndex === start) {
            regex.lastIndex += 1;
          }
        }
      }
    }

    const groupedCandidates = [];
    const groupMap = new Map();

    for (const candidate of candidates) {
      const matchedText = text.slice(candidate.start, candidate.end);
      const groupKey = `${candidate.start}:${candidate.end}:${matchedText.toLowerCase()}`;
      const page = {
        entry: candidate.entry,
        source: candidate.source,
        definition: candidate.entry.definition,
        displayTerm: candidate.source.isAlias ? "" : candidate.entry.displayTerm,
        isAlias: candidate.source.isAlias
      };
      let group = groupMap.get(groupKey);

      if (!group) {
        group = {
          start: candidate.start,
          end: candidate.end,
          length: candidate.length,
          priority: candidate.priority,
          matchedText,
          pages: [],
          entries: new Set()
        };
        groupMap.set(groupKey, group);
        groupedCandidates.push(group);
      }

      group.priority = Math.max(group.priority, candidate.priority);
      if (!group.entries.has(candidate.entry)) {
        group.entries.add(candidate.entry);
        group.pages.push(page);
      }
    }

    for (const group of groupedCandidates) {
      group.pages.sort((a, b) => (b.entry.createdAt || 0) - (a.entry.createdAt || 0));
    }

    groupedCandidates.sort((a, b) => b.length - a.length || b.priority - a.priority || a.start - b.start);
    const selected = [];

    for (const candidate of groupedCandidates) {
      const overlaps = selected.some((match) => candidate.start < match.end && candidate.end > match.start);
      if (!overlaps) {
        selected.push(candidate);
      }
    }

    return selected.sort((a, b) => a.start - b.start);
  }

  function highlightTextNode(node) {
    if (shouldSkipTextNode(node)) {
      return;
    }

    const text = node.nodeValue;
    const matches = findMatches(text);

    if (!matches.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    for (const match of matches) {
      if (match.start > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, match.start)));
      }

      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.glowsaryPages = match.pages;
      span.textContent = text.slice(match.start, match.end);
      attachHighlightEvents(span);
      fragment.appendChild(span);
      cursor = match.end;
    }

    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    suppressMutations = true;
    node.replaceWith(fragment);
    suppressMutations = false;
  }

  function highlightRoot(root) {
    if (!canShowHighlights() || !entries.length || !root || isEditableNode(root)) {
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const node of textNodes) {
      highlightTextNode(node);
    }
  }

  function scheduleHighlight() {
    window.clearTimeout(highlightTimer);
    highlightTimer = window.setTimeout(() => {
      highlightRoot(document.body);
    }, 80);
  }

  function removeHighlights(root = document) {
    dismissPopup();
    const highlights = Array.from(root.querySelectorAll?.(`.${HIGHLIGHT_CLASS}`) || []);

    suppressMutations = true;
    for (const highlight of highlights) {
      const text = document.createTextNode(highlight.textContent || "");
      highlight.replaceWith(text);
      text.parentNode?.normalize();
    }
    suppressMutations = false;
  }

  function refreshHighlights() {
    window.clearTimeout(highlightTimer);
    removeHighlights(document);

    if (canShowHighlights()) {
      scheduleHighlight(document.body);
    }
  }

  function attachHighlightEvents(element) {
    element.addEventListener("mouseenter", () => {
      showPopup(element);
    });

    element.addEventListener("mouseleave", () => {
      schedulePopupDismiss();
    });
  }

  function showPopup(anchor) {
    dismissPopup();

    const pages = Array.isArray(anchor.glowsaryPages) && anchor.glowsaryPages.length
      ? anchor.glowsaryPages
      : [{ definition: "", displayTerm: anchor.textContent || "", isAlias: false }];
    const popup = document.createElement("div");
    popup.className = POPUP_CLASS;
    popup.innerHTML = `<strong></strong><div class="glowsary-popup-definition"></div>`;
    document.documentElement.appendChild(popup);
    activePopup = { element: popup, anchor, pages, pageIndex: 0 };

    popup.addEventListener("mouseenter", () => {
      window.clearTimeout(popupCloseTimer);
    });
    popup.addEventListener("mouseleave", schedulePopupDismiss);

    renderPopupPage();
    positionPopup(anchor, popup);
  }

  function positionPopup(anchor, popup) {
    const rect = anchor.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const gap = 8;
    let top = rect.bottom + gap;
    let left = rect.left;

    if (top + popupRect.height > window.innerHeight - gap) {
      top = rect.top - popupRect.height - gap;
    }

    if (left + popupRect.width > window.innerWidth - gap) {
      left = window.innerWidth - popupRect.width - gap;
    }

    popup.style.top = `${Math.max(gap, top)}px`;
    popup.style.left = `${Math.max(gap, left)}px`;
  }

  function renderPopupPage() {
    if (!activePopup) {
      return;
    }

    const { element, anchor, pages } = activePopup;
    const page = pages[activePopup.pageIndex] || pages[0];
    const title = element.querySelector("strong");
    const definition = element.querySelector(".glowsary-popup-definition");
    const color = globalThis.GlowsaryColorPicker?.normalizeColor?.(page.entry?.color) || "purple";
    globalThis.GlowsarySemanticColorTokens?.applyWordCardMode?.(element, color);
    title.textContent = page.displayTerm || anchor.textContent || "";
    title.hidden = Boolean(page.isAlias);
    definition.textContent = page.definition || "";
    element.querySelector(".glowsary-popup-pagination")?.remove();

    if (pages.length <= 1) {
      positionPopup(anchor, element);
      return;
    }

    const pagination = document.createElement("div");
    pagination.className = "glowsary-popup-pagination";

    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "Prev";
    previous.disabled = activePopup.pageIndex === 0;
    previous.addEventListener("click", () => {
      activePopup.pageIndex = Math.max(0, activePopup.pageIndex - 1);
      renderPopupPage();
    });

    const status = document.createElement("span");
    status.textContent = `${activePopup.pageIndex + 1} / ${pages.length}`;

    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next";
    next.disabled = activePopup.pageIndex === pages.length - 1;
    next.addEventListener("click", () => {
      activePopup.pageIndex = Math.min(pages.length - 1, activePopup.pageIndex + 1);
      renderPopupPage();
    });

    pagination.append(previous, status, next);
    element.appendChild(pagination);
    positionPopup(anchor, element);
  }

  function schedulePopupDismiss() {
    window.clearTimeout(popupCloseTimer);
    popupCloseTimer = window.setTimeout(() => {
      if (!activePopup) {
        return;
      }

      if (activePopup.anchor.matches(":hover") || activePopup.element.matches(":hover")) {
        return;
      }

      dismissPopup();
    }, 180);
  }

  function dismissPopup() {
    window.clearTimeout(popupCloseTimer);
    activePopup?.element.remove();
    activePopup = null;
  }

  function validateEntry(displayTerm, definition, aliasText = "") {
    const cleanTerm = collapseSpaces(displayTerm);
    const cleanDefinition = String(definition || "").trim();

    if (!cleanTerm) {
      return { error: "Word is required." };
    }

    if (cleanTerm.length < 3) {
      return { error: "Word must be at least 3 characters." };
    }

    if (!cleanDefinition) {
      return { error: "Definition is required." };
    }

    const normalizedTerm = normalizeTerm(cleanTerm);
    const aliasResult = parseAliases(aliasText, normalizedTerm);

    if (aliasResult.error) {
      return aliasResult;
    }

    return {
      cleanTerm,
      cleanDefinition,
      normalizedTerm,
      aliases: aliasResult.aliases
    };
  }

  async function saveEntry(displayTerm, definition, aliasText = "", color) {
    const validation = validateEntry(displayTerm, definition, aliasText);

    if (validation.error) {
      throw new Error(validation.error);
    }

    const currentEntries = await getEntries();
    const nextEntry = {
      term: validation.normalizedTerm,
      displayTerm: validation.cleanTerm,
      definition: validation.cleanDefinition,
      aliases: validation.aliases,
      color: normalizeColor(color),
      createdAt: Date.now()
    };
    const nextEntries = currentEntries.concat(nextEntry).sort((a, b) => a.displayTerm.localeCompare(b.displayTerm));

    await storage.set({ [ENTRIES_KEY]: nextEntries });
    entries = nextEntries;
    refreshHighlights();
  }

  async function getEntries() {
    const result = await storage.get({ [ENTRIES_KEY]: [] });
    return Array.isArray(result[ENTRIES_KEY]) ? result[ENTRIES_KEY].map(normalizeEntry) : [];
  }

  function closeDialog() {
    activeDialog?.remove();
    activeDialog = null;
  }

  function openNoteDialog(rawTerm) {
    closeDialog();

    const backdrop = document.createElement("div");
    backdrop.className = "glowsary-dialog-backdrop";
    backdrop.innerHTML = `
      <section class="glowsary-dialog" role="dialog" aria-modal="true" aria-labelledby="glowsary-dialog-title">
        <div class="glowsary-dialog-header">
          <h2 class="glowsary-dialog-title" id="glowsary-dialog-title">Add word</h2>
          <button class="glowsary-dialog-close" type="button" aria-label="Close">&times;</button>
        </div>
        <form class="glowsary-form">
          <div class="glowsary-field">
            <label for="glowsary-term">Word</label>
            <input class="glowsary-input" id="glowsary-term" name="term" autocomplete="off" />
          </div>
          <div class="glowsary-field">
            <label for="glowsary-definition">Definition</label>
            <textarea class="glowsary-textarea" id="glowsary-definition" name="definition"></textarea>
          </div>
          <div class="glowsary-field">
            <label for="glowsary-aliases">Alias</label>
            <input class="glowsary-input" id="glowsary-aliases" name="aliases" autocomplete="off" placeholder="versions, versioned" />
          </div>
          <div class="glowsary-field">
            <label id="glowsary-color-label">Color</label>
            <div id="glowsary-color-picker" aria-labelledby="glowsary-color-label"></div>
          </div>
          <div class="glowsary-error" role="alert"></div>
          <div class="glowsary-actions">
            <button class="glowsary-text-button glowsary-text-button-secondary" type="button" data-action="cancel"><span class="glowsary-text-button-label">Cancel</span></button>
            <button class="glowsary-text-button glowsary-text-button-default" type="submit"><span class="glowsary-text-button-label">Save</span></button>
          </div>
        </form>
      </section>
    `;

    const form = backdrop.querySelector("form");
    const termInput = backdrop.querySelector("#glowsary-term");
    const definitionInput = backdrop.querySelector("#glowsary-definition");
    const aliasInput = backdrop.querySelector("#glowsary-aliases");
    const colorPicker = backdrop.querySelector("#glowsary-color-picker");
    const error = backdrop.querySelector(".glowsary-error");
    const colorPickerController = window.GlowsaryColorPicker?.init?.(colorPicker, { classPrefix: "glowsary-color-picker" });

    termInput.value = collapseSpaces(rawTerm);
    definitionInput.value = "";
    aliasInput.value = "";

    backdrop.querySelector(".glowsary-dialog-close").addEventListener("click", closeDialog);
    backdrop.querySelector("[data-action='cancel']").addEventListener("click", closeDialog);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";

      try {
        await saveEntry(termInput.value, definitionInput.value, aliasInput.value, colorPickerController?.getValue?.());
        closeDialog();
      } catch (saveError) {
        error.textContent = saveError.message;
      }
    });

    document.documentElement.appendChild(backdrop);
    activeDialog = backdrop;
    termInput.focus();
    termInput.select();
  }

  function startObserver() {
    if (observer || !document.body) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (suppressMutations || !canShowHighlights()) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && !node.classList?.contains(HIGHLIGHT_CLASS)) {
              scheduleHighlight(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              scheduleHighlight(node.parentElement || document.body);
            }
          }
        }

        if (mutation.type === "characterData") {
          scheduleHighlight(mutation.target.parentElement || document.body);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function loadState() {
    const result = await storage.get({
      [ENTRIES_KEY]: [],
      [SETTINGS_KEY]: DEFAULT_SETTINGS,
      [EXCLUDED_SITES_KEY]: []
    });

    entries = Array.isArray(result[ENTRIES_KEY]) ? result[ENTRIES_KEY].map(normalizeEntry) : [];
    settings = normalizeSettings(result[SETTINGS_KEY] || {});
    excludedSites = normalizeExcludedSites(result[EXCLUDED_SITES_KEY]);
    currentSiteDomain = await window.GlowsaryDomains?.getWholeSiteDomainFromInput?.(window.location.hostname);

    if (JSON.stringify(result[SETTINGS_KEY] || {}) !== JSON.stringify(settings)) {
      await storage.set({ [SETTINGS_KEY]: settings });
    }

    if (JSON.stringify(result[EXCLUDED_SITES_KEY] || []) !== JSON.stringify(excludedSites)) {
      await storage.set({ [EXCLUDED_SITES_KEY]: excludedSites });
    }
  }

  function bindChromeEvents() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "GLOWSARY_OPEN_NOTE") {
        openNoteDialog(message.selectedText || window.getSelection()?.toString() || "");
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (changes[ENTRIES_KEY]) {
        entries = Array.isArray(changes[ENTRIES_KEY].newValue) ? changes[ENTRIES_KEY].newValue.map(normalizeEntry) : [];
      }

      if (changes[SETTINGS_KEY]) {
        settings = normalizeSettings(changes[SETTINGS_KEY].newValue || {});
      }

      if (changes[EXCLUDED_SITES_KEY]) {
        excludedSites = normalizeExcludedSites(changes[EXCLUDED_SITES_KEY].newValue);
      }

      if (changes[ENTRIES_KEY] || changes[SETTINGS_KEY] || changes[EXCLUDED_SITES_KEY]) {
        refreshHighlights();
      }
    });

    window.addEventListener("scroll", dismissPopup, true);
    window.addEventListener("resize", dismissPopup);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        dismissPopup();
        closeDialog();
      }
    });
  }

  async function init() {
    await loadState();
    bindChromeEvents();
    startObserver();

    if (canShowHighlights()) {
      scheduleHighlight(document.body);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
