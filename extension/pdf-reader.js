// PDF reading feature (FR-47). Lives in the management view's PDF tab.
//
// The matcher, highlight wrapping, Definition Popup, and Add/Edit dialog are ported
// from content.js so reading a PDF behaves exactly like reading a website (FR-47e,
// FR-47f). content.js stays the engine for live web pages and is left untouched;
// this module is the parallel engine for the static text layer pdf.js renders, the
// same way content.js and options.js already each keep their own copy of the save
// logic. Uploaded PDFs are stored locally in IndexedDB (FR-47h) since they are far
// larger than chrome.storage is meant to hold.

import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";

(() => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("vendor/pdfjs/pdf.worker.min.mjs");

  const ENTRIES_KEY = "glowsaryEntries";
  const SETTINGS_KEY = "glowsarySettings";
  const DEFAULT_PROMPT = window.GlowsaryAutoGenerate?.DEFAULT_PROMPT
    || "Write a short dictionary-style definition of the word or phrase in Vietnamese, for an English learner. Reply with only the definition itself: do not repeat the word, do not add quotes, labels, or extra notes. Keep it under 350 characters.";

  const HIGHLIGHT_CLASS = "glowsary-highlight";
  const ACTIVE_HIGHLIGHT_CLASS = "glowsary-highlight--active";
  const POPUP_CLASS = "glowsary-popup";

  const MAX_PDF_BYTES = 50 * 1024 * 1024;
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.2;
  const MASONRY_ROW_GAP = 16;
  // Cap the canvas backing resolution. A page rendered at the full device pixel
  // ratio (often 2x) costs 4x the memory; 1.5x stays crisp while keeping a long
  // PDF affordable, since pages are now rendered lazily as they scroll into view.
  const MAX_OUTPUT_SCALE = 1.5;

  let entries = [];
  let compiledMatchers = [];
  let autoGeneratePrompt = DEFAULT_PROMPT;
  let popupCloseTimer = 0;
  let activePopup = null;
  let activeDialog = null;
  let glowsaryRoot = null;
  let contentFontsPromise = null;
  let lastPointerX = null;
  let lastPointerY = null;
  let pdfRecords = [];
  let gridLayoutFrame = 0;

  // Whatever the open viewer needs to re-render or re-highlight itself.
  let viewer = null;

  const storage = {
    get(keys) {
      return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
    },
    set(values) {
      return new Promise((resolve) => chrome.storage.local.set(values, resolve));
    }
  };

  // ----- Text helpers (ported from content.js) -----

  function collapseSpaces(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function normalizeTerm(value) {
    return collapseSpaces(value).toLowerCase();
  }

  function normalizeColor(value) {
    return window.GlowsaryColorPicker?.normalizeColor?.(value) || "purple";
  }

  function normalizeAliasList(aliases = []) {
    return aliases.map((alias) => ({
      term: normalizeTerm(alias.term || alias.displayTerm || alias),
      displayTerm: collapseSpaces(alias.displayTerm || alias.term || alias)
    })).filter((alias) => alias.term && alias.displayTerm);
  }

  function formatAliases(aliases = []) {
    return normalizeAliasList(aliases).map((alias) => alias.displayTerm).join(", ");
  }

  function normalizeImage(image) {
    if (!image || typeof image !== "object") {
      return undefined;
    }

    const type = image.type === "link" ? "link" : image.type === "local" ? "local" : null;
    const src = typeof image.src === "string" ? image.src.trim() : "";

    if (!type || !src) {
      return undefined;
    }

    return { type, src };
  }

  function normalizeEntry(entry) {
    const { image: rawImage, ...rest } = entry;
    const image = normalizeImage(rawImage);

    return {
      ...rest,
      color: normalizeColor(entry.color),
      aliases: normalizeAliasList(entry.aliases),
      ...(image ? { image } : {})
    };
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

  function buildPattern(term) {
    return term.split(" ").filter(Boolean).map(escapeRegExp).join("\\s+");
  }

  // ----- Matcher (ported from content.js) -----

  function setEntries(nextEntries) {
    entries = Array.isArray(nextEntries) ? nextEntries : [];
    compiledMatchers = entries.map((entry) => {
      const sources = [
        { term: entry.term, displayTerm: entry.displayTerm, isAlias: false },
        ...normalizeAliasList(entry.aliases).map((alias) => ({ ...alias, isAlias: true }))
      ].filter((source) => source.term);

      return {
        entry,
        sources: sources.map((source) => ({
          term: source.term,
          displayTerm: source.displayTerm,
          isAlias: source.isAlias,
          regex: new RegExp(buildPattern(source.term), "gi")
        }))
      };
    });
  }

  function findMatches(text) {
    const candidates = [];

    for (const matcher of compiledMatchers) {
      for (const source of matcher.sources) {
        const regex = source.regex;
        regex.lastIndex = 0;
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
              entry: matcher.entry,
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
        displayTerm: candidate.source.displayTerm,
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

  // ----- Highlighting the text layer (ported, scoped to the reader) -----

  function shouldSkipTextNode(node) {
    if (!node.nodeValue.trim()) {
      return true;
    }

    const parent = node.parentElement;
    if (!parent) {
      return true;
    }

    // Never re-wrap text already inside one of our own surfaces.
    return Boolean(parent.closest(`.${HIGHLIGHT_CLASS}, .${POPUP_CLASS}`));
  }

  // Match across the whole text layer, not one piece at a time, so a saved phrase
  // still highlights when the PDF splits it across separate pieces (FR-47e, FR-6a).
  // pdf.js renders each text run as its own absolutely positioned piece, often one
  // word each, so scanning a single piece can never see a multi-word phrase. Here we
  // join every piece into one string in reading order, match on that, then wrap the
  // matched slice back inside each piece it covers.
  function highlightRoot(root) {
    if (!entries.length || !root) {
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

    if (!textNodes.length) {
      return;
    }

    // Build one combined string across all pieces. Each piece records its offset
    // range in that string. When two pieces meet with no whitespace on either side,
    // a single space is inserted between them, so words the PDF split across pieces
    // or wrapped across a line still read as whitespace-separated (FR-6a). The space
    // is virtual: it belongs to no piece, so it is never wrapped. A hyphen left by
    // hyphenation stays a real character, so "draw-" + "ing" still does not match.
    let combined = "";
    const segments = [];

    for (const node of textNodes) {
      const value = node.nodeValue;
      if (combined && !/\s$/.test(combined) && !/^\s/.test(value)) {
        combined += " ";
      }
      const start = combined.length;
      combined += value;
      segments.push({ node, start, end: combined.length });
    }

    const matches = findMatches(combined);

    if (!matches.length) {
      return;
    }

    // Map each match onto the pieces it overlaps. A match may span several pieces;
    // all of its pieces share one group so the phrase behaves as a single highlight
    // (one active fill and one popup across the whole phrase, FR-9b, FR-13a).
    const piecesByNode = new Map();

    for (const match of matches) {
      const group = [];

      for (const segment of segments) {
        const overlapStart = Math.max(match.start, segment.start);
        const overlapEnd = Math.min(match.end, segment.end);
        if (overlapStart >= overlapEnd) {
          continue;
        }

        const piece = {
          localStart: overlapStart - segment.start,
          localEnd: overlapEnd - segment.start,
          pages: match.pages,
          group
        };
        let list = piecesByNode.get(segment.node);
        if (!list) {
          list = [];
          piecesByNode.set(segment.node, list);
        }
        list.push(piece);
      }
    }

    for (const [node, pieces] of piecesByNode) {
      pieces.sort((a, b) => a.localStart - b.localStart);
      const text = node.nodeValue;
      const fragment = document.createDocumentFragment();
      let cursor = 0;

      for (const piece of pieces) {
        if (piece.localStart < cursor) {
          continue;
        }
        if (piece.localStart > cursor) {
          fragment.appendChild(document.createTextNode(text.slice(cursor, piece.localStart)));
        }

        const span = document.createElement("span");
        span.className = HIGHLIGHT_CLASS;
        span.glowsaryPages = piece.pages;
        span.glowsaryGroup = piece.group;
        span.textContent = text.slice(piece.localStart, piece.localEnd);
        window.GlowsarySemanticColorTokens?.applyWordCardMode?.(span, piece.pages[0]?.entry?.color);
        piece.group.push(span);
        fragment.appendChild(span);
        cursor = piece.localEnd;
      }

      if (cursor < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(cursor)));
      }

      node.replaceWith(fragment);
    }
  }

  function removeHighlights(root) {
    const highlights = Array.from(root?.querySelectorAll?.(`.${HIGHLIGHT_CLASS}`) || []);

    for (const highlight of highlights) {
      const text = document.createTextNode(highlight.textContent || "");
      highlight.replaceWith(text);
      text.parentNode?.normalize();
    }
  }

  // Re-run highlighting across every rendered page after the word list changes
  // (FR-5, FR-47f), so a save/edit/delete reflects in the open PDF right away.
  function reHighlightViewer() {
    if (!viewer) {
      return;
    }

    dismissPopup();
    for (const textLayer of viewer.textLayers) {
      if (textLayer.isConnected) {
        removeHighlights(textLayer);
        highlightRoot(textLayer);
      }
    }
    revealPopupUnderPointer();
  }

  // ----- Shadow root for the Popup and Dialog (ported from content.js) -----

  const CONTENT_FONT_FACES = [
    ["Glowsary Copse", "fonts/Copse/Copse-Regular.ttf", 400],
    ["Glowsary Google Sans Flex", "fonts/GoogleSansFlex/GoogleSansFlex_24pt-Regular.ttf", 400],
    ["Glowsary Google Sans Flex", "fonts/GoogleSansFlex/GoogleSansFlex_24pt-Medium.ttf", 500],
    ["Glowsary Google Sans Flex", "fonts/GoogleSansFlex/GoogleSansFlex_24pt-SemiBold.ttf", 600]
  ];
  const CONTENT_TYPOGRAPHY_OVERRIDE_CSS = `:host {
  --font-family-heading: "Glowsary Copse", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-family-body: "Glowsary Google Sans Flex", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}`;
  const SHADOW_STYLE_SHEETS = ["switch.css", "content.css"];
  const TOKEN_STYLE_IDS = [
    "glowsary-color-tokens",
    "glowsary-semantic-color-tokens",
    "glowsary-typography-tokens",
    "glowsary-semantic-typography-tokens",
    "glowsary-radius-tokens",
    "glowsary-gradient-tokens",
    "glowsary-image-tokens",
    "glowsary-shadow-tokens"
  ];

  function installContentFonts() {
    if (contentFontsPromise || !("FontFace" in window) || !document.fonts?.add) {
      return;
    }

    contentFontsPromise = Promise.all(CONTENT_FONT_FACES.map(async ([family, path, weight]) => {
      try {
        const response = await fetch(chrome.runtime.getURL(path));
        if (!response.ok) {
          return;
        }
        const fontBytes = await response.arrayBuffer();
        const fontFace = new FontFace(family, fontBytes, { style: "normal", weight: String(weight), display: "swap" });
        await fontFace.load();
        document.fonts.add(fontFace);
      } catch {
        // Fall back to the system stack if a font cannot load.
      }
    }));
  }

  function buildShadowTokenCss() {
    const blocks = [];

    for (const id of TOKEN_STYLE_IDS) {
      const cssText = document.getElementById(id)?.textContent;
      if (cssText) {
        blocks.push(cssText.replace(":root", ":host"));
      }
    }

    blocks.push(CONTENT_TYPOGRAPHY_OVERRIDE_CSS);
    return blocks.join("\n");
  }

  function loadShadowStyles(shadow) {
    const tokenStyle = document.createElement("style");
    tokenStyle.textContent = buildShadowTokenCss();
    shadow.append(tokenStyle);

    const style = document.createElement("style");
    shadow.append(style);

    Promise.all(SHADOW_STYLE_SHEETS.map(async (file) => {
      try {
        const response = await fetch(chrome.runtime.getURL(file));
        if (!response.ok) {
          return "";
        }
        const cssText = await response.text();
        return cssText.replace(/__MSG_@@extension_id__/g, chrome.runtime.id);
      } catch {
        return "";
      }
    })).then((sheets) => {
      style.textContent = sheets.join("\n");
    });
  }

  function ensureGlowsaryRoot() {
    if (glowsaryRoot) {
      return glowsaryRoot;
    }

    installContentFonts();
    const host = document.createElement("glowsary-host");
    host.id = "glowsary-pdf-ui-root";
    host.style.cssText = "position: absolute; top: 0; left: 0; width: 0; height: 0; margin: 0; padding: 0; border: 0;";
    glowsaryRoot = host.attachShadow({ mode: "open" });
    loadShadowStyles(glowsaryRoot);
    document.documentElement.append(host);

    return glowsaryRoot;
  }

  // ----- Definition Popup (ported from content.js) -----

  function highlightFromEventTarget(target) {
    return target?.nodeType === Node.ELEMENT_NODE ? target.closest?.(`.${HIGHLIGHT_CLASS}`) : null;
  }

  // A phrase the PDF split across pieces becomes several highlight spans that share
  // one group array. These helpers let the active fill and the sticky-popup checks
  // treat all of a phrase's pieces as one highlight (FR-9b, FR-13).
  function getHighlightGroup(element) {
    const group = element?.glowsaryGroup;
    if (Array.isArray(group) && group.length) {
      return group.filter((member) => member.isConnected);
    }
    return element ? [element] : [];
  }

  function sharesHighlightGroup(a, b) {
    return Boolean(a && b && a.glowsaryGroup && a.glowsaryGroup === b.glowsaryGroup);
  }

  function setGroupActive(element, isActive) {
    for (const member of getHighlightGroup(element)) {
      member.classList.toggle(ACTIVE_HIGHLIGHT_CLASS, isActive);
    }
  }

  function resolveHighlightPages(element) {
    if (Array.isArray(element.glowsaryPages) && element.glowsaryPages.length) {
      return element.glowsaryPages;
    }

    const text = element.textContent || "";
    const matches = findMatches(text);
    const match = matches.find((candidate) => candidate.start === 0 && candidate.end === text.length) || matches[0];

    if (match?.pages?.length) {
      element.glowsaryPages = match.pages;
      return match.pages;
    }

    return null;
  }

  function createPopupPagination() {
    const pagination = document.createElement("div");
    pagination.className = "glowsary-popup-pagination";

    const previous = document.createElement("button");
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous definition");
    const previousIcon = document.createElement("span");
    previousIcon.className = "glowsary-popup-pagination__icon glowsary-popup-pagination__icon--previous";
    previousIcon.setAttribute("aria-hidden", "true");
    previous.append(previousIcon);
    previous.addEventListener("click", () => changePopupPage((activePopup?.pageIndex || 0) - 1));

    const status = document.createElement("span");

    const next = document.createElement("button");
    next.type = "button";
    next.setAttribute("aria-label", "Next definition");
    const nextIcon = document.createElement("span");
    nextIcon.className = "glowsary-popup-pagination__icon glowsary-popup-pagination__icon--next";
    nextIcon.setAttribute("aria-hidden", "true");
    next.append(nextIcon);
    next.addEventListener("click", () => changePopupPage((activePopup?.pageIndex || 0) + 1));

    pagination.append(previous, status, next);
    return { pagination, previous, status, next };
  }

  function showPopup(anchor) {
    dismissPopup();

    const pages = resolveHighlightPages(anchor)
      || [{ definition: "", displayTerm: anchor.textContent || "", isAlias: false }];
    const popup = document.createElement("div");
    popup.className = POPUP_CLASS;

    const wordBlock = document.createElement("div");
    wordBlock.className = "glowsary-popup__word-block";

    const titleRow = document.createElement("div");
    titleRow.className = "glowsary-popup__title-row";

    const titleGroup = document.createElement("div");
    titleGroup.className = "glowsary-popup__title-group";

    const soundButton = document.createElement("button");
    soundButton.className = "glowsary-popup__sound-button";
    soundButton.type = "button";
    const soundIcon = document.createElement("span");
    soundIcon.className = "glowsary-popup__sound-icon";
    soundIcon.setAttribute("aria-hidden", "true");
    soundButton.append(soundIcon);

    const title = document.createElement("strong");
    title.className = "glowsary-popup__title";

    const editButton = document.createElement("button");
    editButton.className = "glowsary-popup__edit-button";
    editButton.type = "button";
    editButton.setAttribute("aria-label", "Edit word");
    editButton.title = "Edit word";
    const editIcon = document.createElement("span");
    editIcon.className = "glowsary-popup__icon glowsary-popup__icon--pencil";
    editIcon.setAttribute("aria-hidden", "true");
    editButton.append(editIcon);

    const media = document.createElement("div");
    media.className = "glowsary-popup__media";
    media.hidden = true;
    const mediaSkeleton = document.createElement("div");
    mediaSkeleton.className = "glowsary-popup__media-skeleton";
    mediaSkeleton.setAttribute("aria-hidden", "true");
    const mediaImg = document.createElement("img");
    mediaImg.className = "glowsary-popup__media-img";
    mediaImg.alt = "";
    mediaImg.decoding = "async";
    const mediaPlaceholder = document.createElement("div");
    mediaPlaceholder.className = "glowsary-popup__media-placeholder";
    const mediaPlaceholderIcon = document.createElement("span");
    mediaPlaceholderIcon.className = "glowsary-popup__media-placeholder-icon";
    mediaPlaceholderIcon.setAttribute("aria-hidden", "true");
    const mediaPlaceholderText = document.createElement("span");
    mediaPlaceholderText.className = "glowsary-popup__media-placeholder-text";
    mediaPlaceholderText.textContent = "Error loading this image.";
    mediaPlaceholder.append(mediaPlaceholderIcon, mediaPlaceholderText);
    media.append(mediaSkeleton, mediaImg, mediaPlaceholder);

    mediaImg.addEventListener("load", () => media.classList.remove("is-loading"));
    mediaImg.addEventListener("error", () => {
      media.classList.remove("is-loading");
      media.classList.add("is-error");
    });

    const definition = document.createElement("div");
    definition.className = "glowsary-popup-definition";

    titleGroup.append(soundButton, title);
    titleRow.append(titleGroup, editButton);
    wordBlock.append(titleRow, definition, media);
    popup.append(wordBlock);

    const controls = pages.length > 1 ? createPopupPagination() : null;
    if (controls) {
      popup.append(controls.pagination);
    }

    ensureGlowsaryRoot().append(popup);
    activePopup = { element: popup, anchor, pages, pageIndex: 0, controls, keepOpenUntil: 0 };
    setGroupActive(anchor, true);

    soundButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const page = activePopup?.pages?.[activePopup.pageIndex];
      const titleText = page?.displayTerm || activePopup?.anchor?.textContent || "";
      window.GlowsarySpeech?.speakEnglish?.(titleText);
    });

    editButton.addEventListener("click", () => {
      const page = activePopup?.pages?.[activePopup.pageIndex];
      if (!page?.entry) {
        return;
      }
      const entry = page.entry;
      dismissPopup();
      openEntryDialog({ mode: "edit", entry });
    });

    popup.addEventListener("mouseenter", () => window.clearTimeout(popupCloseTimer));
    popup.addEventListener("mouseleave", schedulePopupDismiss);

    renderPopupPage();
    positionPopup(anchor, popup);
  }

  function positionPopup(anchor, popup) {
    const rect = anchor.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const gap = 8;
    const viewportBottom = window.innerHeight - gap;
    const viewportRight = window.innerWidth - gap;
    const belowTop = rect.bottom + gap;
    const aboveTop = rect.top - popupRect.height - gap;
    let top = belowTop;
    let left = rect.left;

    if (belowTop + popupRect.height > viewportBottom) {
      top = aboveTop;
      if (top < gap) {
        top = Math.min(Math.max(gap, belowTop), Math.max(gap, viewportBottom - popupRect.height));
      }
    }

    if (left + popupRect.width > viewportRight) {
      left = viewportRight - popupRect.width;
    }

    popup.style.top = `${Math.max(gap, top)}px`;
    popup.style.left = `${Math.max(gap, left)}px`;
  }

  function keepPopupOpenDuringPaging() {
    if (!activePopup) {
      return;
    }
    activePopup.keepOpenUntil = Date.now() + 350;
    window.clearTimeout(popupCloseTimer);
  }

  function keepPopupWithinCurrentPosition(popup) {
    const gap = 8;
    const viewportRight = window.innerWidth - gap;
    const viewportBottom = window.innerHeight - gap;
    const rect = popup.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;

    if (left + rect.width > viewportRight) {
      left = viewportRight - rect.width;
    }
    if (left < gap) {
      left = gap;
    }
    if (top < gap) {
      top = gap;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.maxHeight = "";
    popup.style.overflowY = "";

    const availableHeight = Math.max(120, viewportBottom - top);
    const nextRect = popup.getBoundingClientRect();

    if (nextRect.height > availableHeight) {
      const currentMinHeight = Number.parseFloat(popup.style.minHeight || "0");
      if (currentMinHeight > availableHeight) {
        popup.style.minHeight = `${availableHeight}px`;
      }
      popup.style.maxHeight = `${availableHeight}px`;
      popup.style.overflowY = "auto";
    }
  }

  function changePopupPage(nextIndex) {
    if (!activePopup) {
      return;
    }

    const nextPageIndex = Math.min(Math.max(nextIndex, 0), activePopup.pages.length - 1);
    if (nextPageIndex === activePopup.pageIndex) {
      return;
    }

    const currentRect = activePopup.element.getBoundingClientRect();
    activePopup.element.style.minHeight = `${currentRect.height}px`;
    activePopup.pageIndex = nextPageIndex;
    keepPopupOpenDuringPaging();
    renderPopupPage();
    keepPopupWithinCurrentPosition(activePopup.element);
  }

  function renderPopupPage() {
    if (!activePopup) {
      return;
    }

    const { element, anchor, pages } = activePopup;
    const page = pages[activePopup.pageIndex] || pages[0];
    const title = element.querySelector("strong");
    const definition = element.querySelector(".glowsary-popup-definition");
    const editButton = element.querySelector(".glowsary-popup__edit-button");
    const soundButton = element.querySelector(".glowsary-popup__sound-button");
    const color = window.GlowsaryColorPicker?.normalizeColor?.(page.entry?.color) || "purple";
    const titleText = page.displayTerm || anchor.textContent || "";
    window.GlowsarySemanticColorTokens?.applyWordCardMode?.(element, color);
    title.textContent = titleText;
    title.hidden = false;
    soundButton?.setAttribute("aria-label", `Pronounce ${titleText}`);
    editButton.disabled = !page.entry;
    definition.textContent = page.definition || "";

    const media = element.querySelector(".glowsary-popup__media");
    const mediaImg = media?.querySelector(".glowsary-popup__media-img");

    if (media && mediaImg) {
      const image = page.entry?.image;
      if (image?.src) {
        media.hidden = false;
        media.classList.remove("is-error");
        media.classList.add("is-loading");
        mediaImg.removeAttribute("src");
        mediaImg.src = image.src;
      } else {
        media.hidden = true;
        media.classList.remove("is-loading", "is-error");
        mediaImg.removeAttribute("src");
      }
    }

    if (activePopup.controls) {
      activePopup.controls.previous.disabled = activePopup.pageIndex === 0;
      activePopup.controls.status.textContent = `${activePopup.pageIndex + 1} / ${pages.length}`;
      activePopup.controls.next.disabled = activePopup.pageIndex === pages.length - 1;
    }
  }

  function isPointerOnPopupOrWord() {
    if (!activePopup) {
      return false;
    }

    if (lastPointerX !== null) {
      const element = document.elementFromPoint(lastPointerX, lastPointerY);
      if (!element) {
        return false;
      }

      const host = glowsaryRoot?.host;
      if (host && (element === host || host.contains(element))) {
        return true;
      }

      const highlight = highlightFromEventTarget(element);
      if (!highlight) {
        return false;
      }
      if (highlight === activePopup.anchor) {
        return true;
      }
      // Another piece of the same split phrase still counts as being on the word.
      if (sharesHighlightGroup(highlight, activePopup.anchor)) {
        return true;
      }
      if (highlight.textContent === activePopup.anchor.textContent) {
        activePopup.anchor = highlight;
        return true;
      }
      return false;
    }

    return Boolean(activePopup.anchor.matches?.(":hover") || activePopup.element.matches?.(":hover"));
  }

  function schedulePopupDismiss() {
    window.clearTimeout(popupCloseTimer);
    popupCloseTimer = window.setTimeout(() => {
      if (!activePopup) {
        return;
      }
      if (Date.now() < activePopup.keepOpenUntil) {
        schedulePopupDismiss();
        return;
      }
      if (isPointerOnPopupOrWord()) {
        return;
      }
      dismissPopup();
    }, 180);
  }

  function dismissPopup() {
    window.clearTimeout(popupCloseTimer);
    if (activePopup?.anchor) {
      setGroupActive(activePopup.anchor, false);
    }
    activePopup?.element.remove();
    activePopup = null;
  }

  function revealPopupUnderPointer() {
    if (lastPointerX === null) {
      return;
    }
    if (activePopup) {
      if (activePopup.anchor.isConnected) {
        return;
      }
      dismissPopup();
    }
    const highlight = highlightFromEventTarget(document.elementFromPoint(lastPointerX, lastPointerY));
    if (highlight) {
      showPopup(highlight);
    }
  }

  function handleHighlightPointerOver(event) {
    const highlight = highlightFromEventTarget(event.target);
    if (!highlight) {
      return;
    }
    if (activePopup && (activePopup.anchor === highlight || sharesHighlightGroup(activePopup.anchor, highlight))) {
      window.clearTimeout(popupCloseTimer);
      return;
    }
    showPopup(highlight);
  }

  function handleHighlightPointerOut(event) {
    const highlight = highlightFromEventTarget(event.target);
    if (!highlight) {
      return;
    }
    if (event.relatedTarget && highlight.contains(event.relatedTarget)) {
      return;
    }
    schedulePopupDismiss();
  }

  // ----- Saving (ported from content.js) -----

  function validateEntry(displayTerm, definition, aliasText = "", aliasEnabled = true) {
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
    const aliasResult = aliasEnabled ? parseAliases(aliasText, normalizedTerm) : { aliases: [] };
    if (aliasResult.error) {
      return aliasResult;
    }

    return { cleanTerm, cleanDefinition, normalizedTerm, aliases: aliasResult.aliases };
  }

  async function getEntries() {
    const result = await storage.get({ [ENTRIES_KEY]: [] });
    return Array.isArray(result[ENTRIES_KEY]) ? result[ENTRIES_KEY].map(normalizeEntry) : [];
  }

  async function persistEntries(nextEntries) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ [ENTRIES_KEY]: nextEntries }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    } catch {
      throw new Error("This word could not be saved. The image may be too large for available storage.");
    }
  }

  function findEntryIndex(targetEntry) {
    const identityIndex = entries.findIndex((entry) => entry === targetEntry);
    if (identityIndex >= 0) {
      return identityIndex;
    }
    return entries.findIndex((entry) => (
      entry.createdAt === targetEntry?.createdAt &&
      entry.term === targetEntry?.term &&
      entry.displayTerm === targetEntry?.displayTerm &&
      entry.definition === targetEntry?.definition
    ));
  }

  async function saveEntry(displayTerm, definition, aliasText, color, aliasEnabled, image) {
    const validation = validateEntry(displayTerm, definition, aliasText, aliasEnabled);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const normalizedImage = normalizeImage(image);
    const currentEntries = await getEntries();
    const nextEntry = {
      term: validation.normalizedTerm,
      displayTerm: validation.cleanTerm,
      definition: validation.cleanDefinition,
      aliases: validation.aliases,
      color: normalizeColor(color),
      ...(normalizedImage ? { image: normalizedImage } : {}),
      createdAt: Date.now()
    };
    const nextEntries = currentEntries.concat(nextEntry).sort((a, b) => a.displayTerm.localeCompare(b.displayTerm));

    await persistEntries(nextEntries);
    setEntries(nextEntries);
    reHighlightViewer();
  }

  async function updateEntry(targetEntry, displayTerm, definition, aliasText, color, aliasEnabled, image) {
    const validation = validateEntry(displayTerm, definition, aliasText, aliasEnabled);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const targetIndex = findEntryIndex(targetEntry);
    if (targetIndex < 0) {
      throw new Error("This word could not be found.");
    }

    const normalizedImage = normalizeImage(image);
    const nextEntry = {
      term: validation.normalizedTerm,
      displayTerm: validation.cleanTerm,
      definition: validation.cleanDefinition,
      aliases: validation.aliases,
      color: normalizeColor(color),
      ...(normalizedImage ? { image: normalizedImage } : {}),
      createdAt: targetEntry.createdAt || Date.now()
    };
    const nextEntries = entries.map((entry, index) => (index === targetIndex ? nextEntry : entry))
      .sort((a, b) => a.displayTerm.localeCompare(b.displayTerm));

    await persistEntries(nextEntries);
    setEntries(nextEntries);
    reHighlightViewer();
  }

  async function deleteEntry(targetEntry) {
    const targetIndex = findEntryIndex(targetEntry);
    if (targetIndex < 0) {
      throw new Error("This word could not be found.");
    }

    const nextEntries = entries.filter((entry, index) => index !== targetIndex);
    await storage.set({ [ENTRIES_KEY]: nextEntries });
    setEntries(nextEntries);
    reHighlightViewer();
  }

  function closeDialog() {
    activeDialog?.remove();
    activeDialog = null;
  }

  // The Add/Edit Word dialog, reusing the shared entry-form component the same way
  // content.js does on a web page (FR-47f, FR-2, FR-18).
  function openEntryDialog({ mode = "add", rawTerm = "", entry = null } = {}) {
    closeDialog();
    dismissPopup();

    const isEditMode = mode === "edit" && entry;
    const formattedAliases = isEditMode ? formatAliases(entry.aliases) : "";
    const backdrop = document.createElement("div");
    backdrop.className = "glowsary-dialog-backdrop";
    backdrop.innerHTML = `
      <section class="glowsary-dialog" role="dialog" aria-modal="true" aria-labelledby="glowsary-pdf-dialog-title">
        <div class="glowsary-dialog-header">
          <h2 class="glowsary-dialog-title" id="glowsary-pdf-dialog-title">${isEditMode ? "Edit Word" : "Add Word"}</h2>
          <button class="glowsary-dialog-close" type="button" aria-label="Close">
            <span class="glowsary-dialog-close__icon" aria-hidden="true"></span>
          </button>
        </div>
        <div id="glowsary-entry-form-mount"></div>
        <p class="glowsary-save-error" role="alert"></p>
      </section>
    `;

    // Reuse the content.css mount id so the dialog's flex/scroll rule applies; the
    // web content script never runs on this page, so there is no id collision.
    const formParts = window.GlowsaryEntryForm?.render?.(backdrop.querySelector("#glowsary-entry-form-mount"), {
      classPrefix: "glowsary",
      ids: {
        form: "glowsary-pdf-entry-form",
        term: "glowsary-pdf-term",
        termHint: "glowsary-pdf-term-hint",
        definition: "glowsary-pdf-definition",
        definitionHint: "glowsary-pdf-definition-hint",
        alias: "glowsary-pdf-aliases",
        aliasToggle: "glowsary-pdf-alias-toggle",
        aliasHint: "glowsary-pdf-alias-hint",
        color: "glowsary-pdf-color-picker",
        generate: "glowsary-pdf-generate-definition",
        save: "glowsary-pdf-save-entry",
        delete: "glowsary-pdf-delete-entry"
      },
      mode: isEditMode ? "edit" : "add",
      includeDelete: isEditMode,
      aliasEnabled: isEditMode ? Boolean(formattedAliases) : false,
      values: {
        term: isEditMode ? entry.displayTerm : collapseSpaces(rawTerm),
        definition: isEditMode ? entry.definition : "",
        aliases: formattedAliases,
        color: isEditMode ? entry.color : undefined
      }
    });

    const form = formParts.form;
    const termInput = formParts.termInput;
    const definitionInput = formParts.definitionInput;
    const definitionHint = formParts.definitionHint;
    const aliasInput = formParts.aliasInput;
    const aliasToggle = formParts.aliasToggle;
    const aliasHint = formParts.aliasHint;
    const colorPicker = formParts.colorPicker;
    const saveButton = formParts.saveButton;
    const deleteButton = formParts.deleteButton;
    const termHint = formParts.termHint;
    const saveError = backdrop.querySelector(".glowsary-save-error");
    const colorPickerController = window.GlowsaryColorPicker?.init?.(colorPicker, { classPrefix: "glowsary-color-picker" });
    const imageController = window.GlowsaryImageField?.init?.(formParts.imageMount, {
      classPrefix: "glowsary",
      value: isEditMode ? entry.image : null
    });

    const setTermHint = (message = null) => {
      termHint.textContent = message || "Maximum 50 characters";
      termHint.classList.toggle("is-error", Boolean(message));
    };
    const setDefinitionHint = (message = null) => {
      definitionHint.textContent = message || "Maximum 350 characters";
      definitionHint.classList.toggle("is-error", Boolean(message));
    };
    const setAliasHint = (message = null) => {
      aliasHint.textContent = message || "Aliases are other spellings or forms of this word, like \"versions\" for \"version\". They get the same highlight and definition. Separate each with a comma.";
      aliasHint.classList.toggle("is-error", Boolean(message));
    };
    const isAliasEnabled = () => Boolean(aliasToggle?.checked);
    const syncAliasFieldVisibility = () => {
      aliasInput.hidden = !isAliasEnabled();
      aliasToggle?.setAttribute("aria-expanded", String(isAliasEnabled()));
    };
    const syncSaveState = () => {
      saveButton.disabled = !(termInput.value.trim() && definitionInput.value.trim());
    };
    const clearSaveError = () => {
      saveError.textContent = "";
    };
    const showValidationError = (message) => {
      if (message === "Word is required." || message.startsWith("Word ")) {
        setTermHint(message);
        return true;
      }
      if (message === "Definition is required.") {
        setDefinitionHint(message);
        return true;
      }
      if (message.startsWith("Alias ")) {
        setAliasHint(message);
        return true;
      }
      return false;
    };
    const collectValidationErrors = () => {
      const errors = {};
      const cleanTerm = collapseSpaces(termInput.value);
      const cleanDefinition = definitionInput.value.trim();

      if (!cleanTerm) {
        errors.term = "Word is required.";
      } else if (cleanTerm.length < 3) {
        errors.term = "Word must be at least 3 characters.";
      }
      if (!cleanDefinition) {
        errors.definition = "Definition is required.";
      }

      const normalizedTerm = normalizeTerm(cleanTerm);
      const aliasResult = isAliasEnabled() ? parseAliases(aliasInput.value, normalizedTerm) : { aliases: [] };
      if (aliasResult.error) {
        errors.alias = aliasResult.error;
      }
      return errors;
    };
    const showValidationErrors = (errors) => {
      setTermHint(errors.term || null);
      setDefinitionHint(errors.definition || null);
      setAliasHint(errors.alias || null);
      return Boolean(errors.term || errors.definition || errors.alias);
    };

    backdrop.querySelector(".glowsary-dialog-close").addEventListener("click", closeDialog);
    backdrop.addEventListener("mousedown", (event) => {
      if (event.target === backdrop) {
        closeDialog();
      }
    });
    termInput.addEventListener("input", () => {
      syncSaveState();
      clearSaveError();
      if (collapseSpaces(termInput.value).length >= 3) {
        setTermHint();
      }
    });
    definitionInput.addEventListener("input", () => {
      syncSaveState();
      clearSaveError();
      if (definitionInput.value.trim()) {
        setDefinitionHint();
      }
    });
    aliasInput.addEventListener("input", () => {
      clearSaveError();
      if (!aliasInput.value.trim()) {
        setAliasHint();
        return;
      }
      if (!parseAliases(aliasInput.value, normalizeTerm(collapseSpaces(termInput.value))).error) {
        setAliasHint();
      }
    });
    aliasToggle?.addEventListener("change", () => {
      syncAliasFieldVisibility();
      clearSaveError();
      setAliasHint();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearSaveError();
      if (showValidationErrors(collectValidationErrors())) {
        return;
      }
      try {
        const imageValue = imageController?.getValue?.() || null;
        if (isEditMode) {
          await updateEntry(entry, termInput.value, definitionInput.value, aliasInput.value, colorPickerController?.getValue?.(), isAliasEnabled(), imageValue);
        } else {
          await saveEntry(termInput.value, definitionInput.value, aliasInput.value, colorPickerController?.getValue?.(), isAliasEnabled(), imageValue);
        }
        closeDialog();
      } catch (error) {
        if (!showValidationError(error.message)) {
          saveError.textContent = error.message;
        }
      }
    });
    deleteButton?.addEventListener("click", async () => {
      clearSaveError();
      try {
        await deleteEntry(entry);
        closeDialog();
      } catch (error) {
        saveError.textContent = error.message;
      }
    });
    window.GlowsaryAutoGenerate?.attach?.({
      button: formParts.generateButton,
      termInput,
      definitionInput,
      getPrompt: () => autoGeneratePrompt,
      setError: (message) => setDefinitionHint(message),
      onFilled: () => {
        clearSaveError();
        syncSaveState();
      }
    });
    syncAliasFieldVisibility();
    syncSaveState();

    ensureGlowsaryRoot().append(backdrop);
    activeDialog = backdrop;
    termInput.focus();
    termInput.select();
  }

  // ----- IndexedDB store for uploaded PDFs (FR-47h) -----

  const DB_NAME = "glowsary-pdf-store";
  const DB_VERSION = 1;
  const PDF_STORE = "pdfs";
  let dbPromise = null;

  function openDb() {
    if (dbPromise) {
      return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PDF_STORE)) {
          db.createObjectStore(PDF_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function dbGetAllMeta() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PDF_STORE, "readonly");
      const request = tx.objectStore(PDF_STORE).getAll();
      request.onsuccess = () => {
        // Drop the heavy file bytes; the grid only needs metadata and the cover.
        const records = (request.result || []).map(({ data, ...meta }) => meta);
        records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function dbGetOne(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PDF_STORE, "readonly");
      const request = tx.objectStore(PDF_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbPut(record) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PDF_STORE, "readwrite");
      tx.objectStore(PDF_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbDelete(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PDF_STORE, "readwrite");
      tx.objectStore(PDF_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ----- PDF grid UI (FR-47a, FR-47b, FR-47c) -----

  const grid = document.querySelector("#pdf-grid");
  const gridEmptyState = document.querySelector("#pdf-empty-state");
  const pdfCountLabel = document.querySelector("#pdf-count");
  const fileInput = document.querySelector("#pdf-file-input");

  function scheduleGridLayout() {
    window.cancelAnimationFrame(gridLayoutFrame);
    gridLayoutFrame = window.requestAnimationFrame(() => {
      if (!grid || grid.offsetParent === null) {
        return;
      }
      const cards = grid.children;
      for (const card of cards) {
        card.style.gridRowEnd = "auto";
        const height = card.getBoundingClientRect().height;
        const span = Math.ceil((height + MASONRY_ROW_GAP) / (1 + MASONRY_ROW_GAP));
        card.style.gridRowEnd = `span ${span}`;
      }
    });
  }

  function buildUploadCard() {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pdf-card--upload";
    const icon = document.createElement("span");
    icon.className = "pdf-card-upload-icon";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "pdf-card-upload-label";
    label.textContent = "Upload PDF";
    card.append(icon, label);
    card.addEventListener("click", () => fileInput?.click());
    return card;
  }

  function buildPdfCard(record) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pdf-card";
    card.setAttribute("aria-label", `Open ${record.name}`);

    const cover = document.createElement("img");
    cover.className = "pdf-card-cover";
    cover.alt = "";
    cover.decoding = "async";
    if (record.cover) {
      cover.src = record.cover;
    } else {
      cover.classList.add("pdf-card-cover--placeholder");
    }
    cover.addEventListener("load", scheduleGridLayout);

    const name = document.createElement("span");
    name.className = "pdf-card-name";
    name.textContent = record.name;

    const deleteButton = document.createElement("span");
    deleteButton.className = "pdf-card-delete";
    deleteButton.setAttribute("role", "button");
    deleteButton.setAttribute("tabindex", "0");
    deleteButton.setAttribute("aria-label", `Remove ${record.name}`);
    deleteButton.title = "Remove PDF";
    const deleteIcon = document.createElement("span");
    deleteIcon.className = "pdf-card-delete-icon";
    deleteIcon.setAttribute("aria-hidden", "true");
    deleteButton.append(deleteIcon);

    const onDelete = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Immediate delete, no confirm and no undo, matching the rest of the app (FR-47c, FR-18a).
      await dbDelete(record.id);
      await refreshGrid();
    };
    deleteButton.addEventListener("click", onDelete);
    deleteButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        onDelete(event);
      }
    });

    card.append(cover, name, deleteButton);
    card.addEventListener("click", () => openViewer(record.id));
    return card;
  }

  function renderGrid() {
    if (!grid) {
      return;
    }
    grid.textContent = "";
    grid.append(buildUploadCard());
    for (const record of pdfRecords) {
      grid.append(buildPdfCard(record));
    }

    const hasPdfs = pdfRecords.length > 0;
    grid.classList.toggle("pdf-grid--empty", !hasPdfs);
    if (gridEmptyState) {
      gridEmptyState.hidden = hasPdfs;
    }
    if (pdfCountLabel) {
      pdfCountLabel.textContent = String(pdfRecords.length);
    }
    scheduleGridLayout();
  }

  async function refreshGrid() {
    pdfRecords = await dbGetAllMeta();
    renderGrid();
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) {
      window.alert(message);
      return;
    }
    toast.textContent = message;
    toast.classList.remove("is-error");
    toast.classList.add("is-error");
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 5000);
  }

  // Render page 1 to a small JPEG cover thumbnail (FR-47b).
  async function renderCover(pdf) {
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const targetWidth = 480;
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const canvasContext = canvas.getContext("2d");
    canvasContext.fillStyle = "#ffffff";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  async function handleFileChosen(file) {
    if (!file) {
      return;
    }
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      showToast("That file is not a PDF.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      showToast("That PDF is too large (over 50 MB).");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      // pdf.js detaches the buffer it parses, so keep a separate copy for storage.
      const stored = data.slice(0);
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const cover = await renderCover(pdf).catch(() => null);
      await pdf.destroy();

      const record = {
        id: `${Date.now()}-${Math.round(performance.now())}`,
        name: file.name.replace(/\.pdf$/i, ""),
        size: file.size,
        data: stored,
        cover,
        createdAt: Date.now()
      };
      await dbPut(record);
      await refreshGrid();
    } catch {
      showToast("This PDF could not be opened.");
    }
  }

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    await handleFileChosen(file);
  });

  // ----- Full-screen PDF reader (FR-47d, FR-47e) -----

  function buildViewerShell() {
    const root = document.createElement("div");
    root.className = "glowsary-pdf-viewer";
    root.hidden = true;
    root.innerHTML = `
      <div class="glowsary-pdf-viewer__toolbar">
        <span class="glowsary-pdf-viewer__title"></span>
        <div class="glowsary-pdf-viewer__controls">
          <button class="glowsary-pdf-viewer__button" data-action="prev" type="button" aria-label="Previous page">
            <span class="glowsary-pdf-viewer__button-icon glowsary-pdf-viewer__button-icon--prev" aria-hidden="true"></span>
          </button>
          <span class="glowsary-pdf-viewer__readout" data-readout="page">1 / 1</span>
          <button class="glowsary-pdf-viewer__button" data-action="next" type="button" aria-label="Next page">
            <span class="glowsary-pdf-viewer__button-icon glowsary-pdf-viewer__button-icon--next" aria-hidden="true"></span>
          </button>
          <span class="glowsary-pdf-viewer__divider" aria-hidden="true"></span>
          <button class="glowsary-pdf-viewer__button" data-action="zoom-out" type="button" aria-label="Zoom out">
            <span class="glowsary-pdf-viewer__button-icon glowsary-pdf-viewer__button-icon--zoom-out" aria-hidden="true"></span>
          </button>
          <span class="glowsary-pdf-viewer__readout" data-readout="zoom">100%</span>
          <button class="glowsary-pdf-viewer__button" data-action="zoom-in" type="button" aria-label="Zoom in">
            <span class="glowsary-pdf-viewer__button-icon glowsary-pdf-viewer__button-icon--zoom-in" aria-hidden="true"></span>
          </button>
        </div>
        <span class="glowsary-pdf-viewer__divider" aria-hidden="true"></span>
        <button class="glowsary-pdf-viewer__button glowsary-pdf-viewer__close" data-action="close" type="button" aria-label="Close reader">
          <span class="glowsary-pdf-viewer__button-icon" aria-hidden="true"></span>
        </button>
      </div>
      <div class="glowsary-pdf-viewer__pages" tabindex="-1"></div>
    `;
    document.body.append(root);
    return root;
  }

  function updatePageReadout() {
    if (!viewer) {
      return;
    }
    const containerTop = viewer.pagesContainer.getBoundingClientRect().top;
    let current = 1;
    viewer.pageViews.forEach((view, index) => {
      if (view.el.getBoundingClientRect().top - containerTop <= 80) {
        current = index + 1;
      }
    });
    viewer.currentPage = current;
    viewer.readouts.page.textContent = `${current} / ${viewer.totalPages}`;
    viewer.buttons.prev.disabled = current <= 1;
    viewer.buttons.next.disabled = current >= viewer.totalPages;
  }

  // Build empty, correctly sized placeholders for every page up front, but render
  // their canvas and text only when they scroll near the viewport. Opening even a
  // long PDF is then instant, and memory tracks the pages actually viewed rather
  // than the whole document (the earlier eager render of every page was the main
  // cause of the reader feeling far slower than reading on a web page).
  function layoutPlaceholders() {
    const scale = viewer.fitScale * viewer.zoom;
    const width = Math.floor(viewer.baseDims.width * scale);
    const height = Math.floor(viewer.baseDims.height * scale);

    if (viewer.pageViews.length === 0) {
      for (let pageNumber = 1; pageNumber <= viewer.totalPages; pageNumber += 1) {
        const el = document.createElement("div");
        el.className = "glowsary-pdf-page";
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        viewer.pagesContainer.append(el);
        viewer.pageViews.push({ el, pageNumber, rendered: false, rendering: false, renderTask: null, textLayerDiv: null });
      }
      return;
    }

    for (const view of viewer.pageViews) {
      view.el.style.width = `${width}px`;
      view.el.style.height = `${height}px`;
    }
  }

  async function renderPage(view) {
    if (!viewer || view.rendered || view.rendering) {
      return;
    }
    view.rendering = true;
    const token = viewer.renderToken;

    try {
      const page = await viewer.pdf.getPage(view.pageNumber);
      if (viewer?.renderToken !== token) {
        view.rendering = false;
        return;
      }

      const scale = viewer.fitScale * viewer.zoom;
      const viewport = page.getViewport({ scale });
      const outputScale = Math.min(window.devicePixelRatio || 1, MAX_OUTPUT_SCALE);

      // Correct the placeholder to this page's real size (handles mixed page sizes).
      view.el.style.width = `${Math.floor(viewport.width)}px`;
      view.el.style.height = `${Math.floor(viewport.height)}px`;

      const canvas = document.createElement("canvas");
      canvas.className = "glowsary-pdf-page__canvas";
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const textLayerDiv = document.createElement("div");
      textLayerDiv.className = "textLayer";
      textLayerDiv.style.setProperty("--scale-factor", String(scale));

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;
      const task = page.render({ canvasContext: canvas.getContext("2d"), viewport, transform });
      view.renderTask = task;
      await task.promise;
      if (viewer?.renderToken !== token) {
        view.rendering = false;
        return;
      }

      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: page.streamTextContent(),
        container: textLayerDiv,
        viewport
      });
      await textLayer.render();
      if (viewer?.renderToken !== token) {
        view.rendering = false;
        return;
      }

      view.el.textContent = "";
      view.el.append(canvas, textLayerDiv);
      view.textLayerDiv = textLayerDiv;
      // Highlight saved words in this page's text the moment it is ready (FR-47e).
      highlightRoot(textLayerDiv);
      viewer.textLayers.push(textLayerDiv);
      view.rendered = true;
      view.rendering = false;
      revealPopupUnderPointer();
    } catch {
      // A cancelled render (zoom or close) or a bad page just leaves the placeholder.
      view.rendering = false;
    }
  }

  function renderVisiblePages() {
    if (!viewer) {
      return;
    }
    const containerRect = viewer.pagesContainer.getBoundingClientRect();
    const margin = containerRect.height; // also prepare one screenful above and below
    for (const view of viewer.pageViews) {
      if (view.rendered || view.rendering) {
        continue;
      }
      const rect = view.el.getBoundingClientRect();
      if (rect.bottom >= containerRect.top - margin && rect.top <= containerRect.bottom + margin) {
        renderPage(view);
      }
    }
  }

  async function buildPages() {
    if (!viewer) {
      return;
    }
    const { pagesContainer, pdf } = viewer;
    pagesContainer.textContent = "";
    viewer.pageViews = [];
    viewer.textLayers = [];

    // Fit the page to the reading area; the user's zoom multiplies this.
    const firstPage = await pdf.getPage(1);
    const natural = firstPage.getViewport({ scale: 1 });
    viewer.baseDims = { width: natural.width, height: natural.height };
    const available = Math.max(320, pagesContainer.clientWidth - 48);
    viewer.fitScale = Math.min(available / natural.width, 2);

    layoutPlaceholders();
    renderVisiblePages();
    updatePageReadout();
  }

  function setZoom(nextZoom) {
    if (!viewer) {
      return;
    }
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(nextZoom.toFixed(2))));
    if (clamped === viewer.zoom) {
      return;
    }
    viewer.zoom = clamped;
    viewer.readouts.zoom.textContent = `${Math.round(clamped * 100)}%`;

    // Drop every rendered page back to a placeholder at the new scale and re-render
    // only what is on screen, instead of re-rendering the whole document.
    viewer.renderToken = Symbol("zoom");
    dismissPopup();
    for (const view of viewer.pageViews) {
      view.renderTask?.cancel?.();
      view.renderTask = null;
      view.rendered = false;
      view.rendering = false;
      view.textLayerDiv = null;
      view.el.textContent = "";
    }
    viewer.textLayers = [];
    layoutPlaceholders();
    renderVisiblePages();
  }

  function scrollToPage(pageNumber) {
    if (!viewer) {
      return;
    }
    viewer.pageViews[pageNumber - 1]?.el.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function closeViewer() {
    if (!viewer) {
      return;
    }
    dismissPopup();
    closeDialog();
    viewer.renderToken = null;
    window.cancelAnimationFrame(viewer.scrollFrame);
    for (const view of viewer.pageViews) {
      view.renderTask?.cancel?.();
    }
    viewer.pdf?.destroy?.();
    viewer.root.hidden = true;
    viewer.pagesContainer.textContent = "";
    document.body.classList.remove("glowsary-pdf-open");
    viewer = null;
  }

  async function openViewer(id) {
    const record = await dbGetOne(id);
    if (!record?.data) {
      showToast("This PDF could not be found.");
      await refreshGrid();
      return;
    }

    const root = buildViewerShell();
    const pagesContainer = root.querySelector(".glowsary-pdf-viewer__pages");
    const buttons = {
      prev: root.querySelector('[data-action="prev"]'),
      next: root.querySelector('[data-action="next"]'),
      zoomIn: root.querySelector('[data-action="zoom-in"]'),
      zoomOut: root.querySelector('[data-action="zoom-out"]'),
      close: root.querySelector('[data-action="close"]')
    };
    const readouts = {
      page: root.querySelector('[data-readout="page"]'),
      zoom: root.querySelector('[data-readout="zoom"]')
    };

    root.querySelector(".glowsary-pdf-viewer__title").textContent = record.name;

    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: new Uint8Array(record.data) }).promise;
    } catch {
      root.remove();
      showToast("This PDF could not be opened.");
      return;
    }

    viewer = {
      root,
      pagesContainer,
      buttons,
      readouts,
      pdf,
      totalPages: pdf.numPages,
      zoom: 1,
      currentPage: 1,
      textLayers: [],
      pageViews: [],
      baseDims: null,
      fitScale: 1,
      renderToken: Symbol("open"),
      scrollFrame: 0
    };

    buttons.prev.addEventListener("click", () => scrollToPage(Math.max(1, viewer.currentPage - 1)));
    buttons.next.addEventListener("click", () => scrollToPage(Math.min(viewer.totalPages, viewer.currentPage + 1)));
    buttons.zoomIn.addEventListener("click", () => setZoom(viewer.zoom + ZOOM_STEP));
    buttons.zoomOut.addEventListener("click", () => setZoom(viewer.zoom - ZOOM_STEP));
    buttons.close.addEventListener("click", closeViewer);

    // Hover-to-reveal popups and close-on-scroll, scoped to the reader (FR-47e).
    pagesContainer.addEventListener("pointermove", (event) => {
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    }, true);
    pagesContainer.addEventListener("mouseover", handleHighlightPointerOver, true);
    pagesContainer.addEventListener("mouseout", handleHighlightPointerOut, true);
    pagesContainer.addEventListener("scroll", () => {
      dismissPopup();
      // Coalesce scroll work into one frame: render newly visible pages and update
      // the page readout without thrashing on every scroll event.
      window.cancelAnimationFrame(viewer.scrollFrame);
      viewer.scrollFrame = window.requestAnimationFrame(() => {
        renderVisiblePages();
        updatePageReadout();
      });
    });
    pagesContainer.addEventListener("contextmenu", handleViewerContextMenu);

    root.hidden = false;
    document.body.classList.add("glowsary-pdf-open");
    await buildPages();
  }

  // ----- Right-click "Add word" inside the reader (FR-47f) -----

  let contextMenu = null;

  function dismissContextMenu() {
    contextMenu?.remove();
    contextMenu = null;
  }

  function handleViewerContextMenu(event) {
    const selection = collapseSpaces(window.getSelection?.()?.toString() || "");
    event.preventDefault();
    dismissContextMenu();

    const menu = document.createElement("div");
    menu.className = "glowsary-pdf-menu";
    const item = document.createElement("button");
    item.type = "button";
    item.className = "glowsary-pdf-menu__item";
    item.textContent = "Add word";
    item.addEventListener("click", () => {
      dismissContextMenu();
      openEntryDialog({ mode: "add", rawTerm: selection });
    });
    menu.append(item);
    document.body.append(menu);
    contextMenu = menu;

    const menuRect = menu.getBoundingClientRect();
    const left = Math.min(event.clientX, window.innerWidth - menuRect.width - 8);
    const top = Math.min(event.clientY, window.innerHeight - menuRect.height - 8);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
  }

  document.addEventListener("mousedown", (event) => {
    if (contextMenu && !contextMenu.contains(event.target)) {
      dismissContextMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (activeDialog) {
      closeDialog();
      return;
    }
    if (activePopup) {
      dismissPopup();
      return;
    }
    if (contextMenu) {
      dismissContextMenu();
      return;
    }
    if (viewer) {
      closeViewer();
    }
  });

  window.addEventListener("resize", () => {
    dismissPopup();
    scheduleGridLayout();
  });

  // ----- Loading and live updates -----

  async function loadState() {
    const result = await storage.get({ [ENTRIES_KEY]: [], [SETTINGS_KEY]: {} });
    setEntries(Array.isArray(result[ENTRIES_KEY]) ? result[ENTRIES_KEY].map(normalizeEntry) : []);
    const rawSettings = result[SETTINGS_KEY] || {};
    autoGeneratePrompt = typeof rawSettings.autoGeneratePrompt === "string" && rawSettings.autoGeneratePrompt.trim()
      ? rawSettings.autoGeneratePrompt
      : DEFAULT_PROMPT;
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (changes[ENTRIES_KEY]) {
      setEntries(Array.isArray(changes[ENTRIES_KEY].newValue) ? changes[ENTRIES_KEY].newValue.map(normalizeEntry) : []);
      reHighlightViewer();
    }
    if (changes[SETTINGS_KEY]) {
      const next = changes[SETTINGS_KEY].newValue || {};
      autoGeneratePrompt = typeof next.autoGeneratePrompt === "string" && next.autoGeneratePrompt.trim()
        ? next.autoGeneratePrompt
        : DEFAULT_PROMPT;
    }
  });

  // Recompute the masonry grid when the PDF tab becomes visible, since layout math
  // needs the panel on screen (mirrors how the Home grid is handled).
  document.querySelector("#management-tab-nav")?.addEventListener("glowsary-tab-change", (event) => {
    if (event.detail?.activeTab === "pdf") {
      scheduleGridLayout();
    }
  });

  async function init() {
    // Build the popup/dialog shadow root now so its styles (content.css) are fetched
    // and applied before the first hover or Add Word, instead of loading lazily on
    // first use, which made that first surface flash unstyled in the wrong place.
    ensureGlowsaryRoot();
    await loadState();
    await refreshGrid();
  }

  init();
})();
