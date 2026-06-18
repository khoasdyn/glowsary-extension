const ENTRIES_KEY = "glowsaryEntries";
const SETTINGS_KEY = "glowsarySettings";
const EXCLUDED_SITES_KEY = "glowsaryExcludedSites";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  managementSort: "latest",
  autoGenerateLanguage: "en",
  autoGenerateKeyMode: "shared",
  autoGenerateCustomKey: ""
};

let entries = [];
let settings = { ...DEFAULT_SETTINGS };
let excludedSites = [];
let editingEntry = null;
let searchQuery = "";
let activeManagementTab = "home";
let entryColorPicker = null;
let entryImageField = null;
let entryGenerateControl = null;

const entryForm = window.GlowsaryEntryForm?.render?.(document.querySelector("#entry-form-mount"), {
  includeDelete: true,
  mode: "add"
});

const elements = {
  managementTabNav: document.querySelector("#management-tab-nav"),
  managementTabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  editorPanel: document.querySelector("#editor-panel"),
  editorTitle: document.querySelector("#editor-title"),
  closeEditor: document.querySelector("#close-editor"),
  siteDialog: document.querySelector("#site-dialog"),
  closeSiteDialog: document.querySelector("#close-site-dialog"),
  siteDialogForm: document.querySelector("#site-dialog-form"),
  siteInput: document.querySelector("#site-input"),
  siteHint: document.querySelector("#site-hint"),
  saveSite: document.querySelector("#save-site"),
  deleteEntryFromPanel: document.querySelector("#delete-entry-from-panel"),
  form: document.querySelector("#entry-form"),
  termInput: document.querySelector("#term-input"),
  termHint: document.querySelector("#term-hint"),
  definitionInput: document.querySelector("#definition-input"),
  definitionHint: document.querySelector("#definition-hint"),
  aliasInput: document.querySelector("#alias-input"),
  aliasToggle: document.querySelector("#alias-toggle"),
  aliasHint: document.querySelector("#alias-hint"),
  colorPicker: document.querySelector("#color-picker"),
  saveEntry: document.querySelector("#save-entry"),
  entryCount: document.querySelector("#entry-count"),
  exportEntries: document.querySelector("#export-entries"),
  importEntries: document.querySelector("#import-entries"),
  importFile: document.querySelector("#import-file"),
  addExcludedSite: document.querySelector("#add-excluded-site"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  autogenerateLanguageSelect: document.querySelector("#autogenerate-language-select"),
  autogenerateKeyRadios: Array.from(document.querySelectorAll('input[name="autogenerate-key-mode"]')),
  autogenerateCustomKey: document.querySelector("#autogenerate-custom-key"),
  autogenerateKeyInput: document.querySelector("#autogenerate-key-input"),
  saveAutogenerateKey: document.querySelector("#save-autogenerate-key"),
  autogenerateKeyResult: document.querySelector("#autogenerate-key-result"),
  emptyState: document.querySelector("#empty-state"),
  entryList: document.querySelector("#entry-list"),
  excludedCount: document.querySelector("#excluded-count"),
  excludedList: document.querySelector("#excluded-list"),
  toast: document.querySelector("#toast")
};

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
    color: window.GlowsaryColorPicker?.normalizeColor?.(entry.color) || "purple",
    aliases: normalizeAliasList(entry.aliases),
    ...(image ? { image } : {})
  };
}

function normalizeExcludedSites(sites = []) {
  return window.GlowsaryDomains?.normalizeExcludedSites?.(sites) || [];
}

async function normalizeExcludedSitesToWholeSiteDomains(sites = []) {
  const seen = new Set();
  const normalizedSites = [];

  for (const site of normalizeExcludedSites(sites)) {
    const domain = await window.GlowsaryDomains?.getWholeSiteDomainFromInput?.(site.domain);

    if (!domain || seen.has(domain)) {
      continue;
    }

    seen.add(domain);
    normalizedSites.push({
      ...site,
      domain
    });
  }

  return normalizedSites;
}

function normalizeSettings(rawSettings = {}) {
  return {
    highlightingEnabled: rawSettings.highlightingEnabled !== false,
    managementSort: rawSettings.managementSort === "az" ? "az" : "latest",
    autoGenerateLanguage: rawSettings.autoGenerateLanguage === "vi" ? "vi" : "en",
    autoGenerateKeyMode: rawSettings.autoGenerateKeyMode === "custom" ? "custom" : "shared",
    autoGenerateCustomKey: typeof rawSettings.autoGenerateCustomKey === "string" ? rawSettings.autoGenerateCustomKey : ""
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

function formatAliases(aliases = []) {
  return normalizeAliasList(aliases).map((alias) => alias.displayTerm).join(", ");
}

function quoteCsvField(value) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function serializeEntriesToCsv(savedEntries) {
  return savedEntries.map((entry) => [
    entry.displayTerm || entry.term || "",
    entry.definition || "",
    formatAliases(entry.aliases)
  ].map(quoteCsvField).join(",")).join("\r\n");
}

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;
  let fieldStarted = false;
  let wroteRowContent = false;

  function finishField() {
    row.push(field);
    field = "";
    afterQuote = false;
    fieldStarted = false;
  }

  function finishRow() {
    finishField();
    rows.push(row);
    row = [];
    wroteRowContent = false;
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (afterQuote) {
      if (char === ",") {
        finishField();
      } else if (char === "\n") {
        finishRow();
      } else if (char === "\r") {
        if (nextChar === "\n") {
          index += 1;
        }
        finishRow();
      } else {
        throw new Error("Malformed CSV.");
      }
      continue;
    }

    if (char === '"') {
      if (fieldStarted || field) {
        throw new Error("Malformed CSV.");
      }
      inQuotes = true;
      fieldStarted = true;
      wroteRowContent = true;
    } else if (char === ",") {
      finishField();
      wroteRowContent = true;
    } else if (char === "\n") {
      finishRow();
    } else if (char === "\r") {
      if (nextChar === "\n") {
        index += 1;
      }
      finishRow();
    } else {
      field += char;
      fieldStarted = true;
      wroteRowContent = true;
    }
  }

  if (inQuotes) {
    throw new Error("Malformed CSV.");
  }

  if (afterQuote || field || fieldStarted || row.length > 0 || wroteRowContent) {
    finishField();
    rows.push(row);
  }

  return rows;
}

function normalizeDefinitionForDuplicate(definition) {
  return String(definition || "").trim().toLowerCase();
}

function getDuplicateKey(entry) {
  const aliasTerms = normalizeAliasList(entry.aliases)
    .map((alias) => alias.term)
    .sort();

  return JSON.stringify([
    normalizeTerm(entry.displayTerm || entry.term),
    normalizeDefinitionForDuplicate(entry.definition),
    aliasTerms
  ]);
}

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

  return {
    cleanTerm,
    cleanDefinition,
    normalizedTerm,
    aliases: aliasResult.aliases
  };
}

function hasRequiredEntryFields() {
  return Boolean(elements.termInput.value.trim() && elements.definitionInput.value.trim());
}

function setTermHint(message = null) {
  elements.termHint.textContent = message || "Maximum 50 characters";
  elements.termHint.classList.toggle("is-error", Boolean(message));
}

function setDefinitionHint(message = null) {
  elements.definitionHint.textContent = message || "Maximum 350 characters";
  elements.definitionHint.classList.toggle("is-error", Boolean(message));
}

function setAliasHint(message = null) {
  elements.aliasHint.textContent = message || "Aliases are other spellings or forms of this word, like \"versions\" for \"version\". They get the same highlight and definition. Separate each with a comma.";
  elements.aliasHint.classList.toggle("is-error", Boolean(message));
}

function isAliasEnabled() {
  return Boolean(elements.aliasToggle?.checked);
}

function syncAliasFieldVisibility() {
  elements.aliasInput.hidden = !isAliasEnabled();
  elements.aliasToggle?.setAttribute("aria-expanded", String(isAliasEnabled()));
}

function syncEntrySaveState() {
  elements.saveEntry.disabled = !hasRequiredEntryFields();

  if (elements.termInput.value.trim()) {
    setTermHint();
  }

  if (elements.definitionInput.value.trim()) {
    setDefinitionHint();
  }

  if (elements.aliasInput.value.trim()) {
    setAliasHint();
  }
}

let toastTimer = null;

function showToast(message, kind = "info") {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", kind === "error");
  elements.toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 5000);
}

function handleManagementTabChange(event) {
  const nextTab = event.detail.activeTab;
  const currentPanel = elements.managementTabPanels.find((panel) => panel.dataset.tabPanel === activeManagementTab);

  if (nextTab !== activeManagementTab && currentPanel?.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  activeManagementTab = nextTab;

  for (const panel of elements.managementTabPanels) {
    panel.hidden = panel.dataset.tabPanel !== activeManagementTab;
  }
}

function initManagementTabNav() {
  elements.managementTabNav?.addEventListener("glowsary-tab-change", handleManagementTabChange);
  window.GlowsaryTabNav?.init?.(elements.managementTabNav, { defaultValue: activeManagementTab });
}

function initEntryColorPicker() {
  entryColorPicker = window.GlowsaryColorPicker?.init?.(elements.colorPicker);
}

function initEntryImageField() {
  entryImageField = window.GlowsaryImageField?.init?.(entryForm?.imageMount, { value: null });
}

function initEntryGenerate() {
  entryGenerateControl = window.GlowsaryAutoGenerate?.attach?.({
    button: entryForm?.generateButton,
    termInput: elements.termInput,
    definitionInput: elements.definitionInput,
    getLanguage: () => settings.autoGenerateLanguage,
    setError: (message) => setDefinitionHint(message),
    onFilled: () => syncEntrySaveState()
  });
}

function showEditor(entry = null) {
  editingEntry = entry;
  elements.editorTitle.textContent = entry ? "Edit Word" : "Add Word";
  elements.termInput.value = entry?.displayTerm || "";
  elements.definitionInput.value = entry?.definition || "";
  elements.aliasInput.value = entry ? formatAliases(entry.aliases) : "";
  elements.aliasToggle.checked = Boolean(elements.aliasInput.value.trim());
  syncAliasFieldVisibility();
  entryColorPicker?.setValue(entry?.color);
  entryImageField?.setValue(entry?.image || null);
  entryForm?.setMode(entry ? "edit" : "add");
  setTermHint();
  setDefinitionHint();
  setAliasHint();
  syncEntrySaveState();
  entryGenerateControl?.refresh();
  elements.editorPanel.hidden = false;
  syncModalOpenState();
  elements.termInput.focus();
}

function hideEditor() {
  elements.editorPanel.hidden = true;
  syncModalOpenState();
  editingEntry = null;
  elements.form.reset();
  elements.aliasToggle.checked = false;
  syncAliasFieldVisibility();
  entryColorPicker?.setValue();
  entryImageField?.reset();
  entryForm?.setMode("add");
  setTermHint();
  setDefinitionHint();
  setAliasHint();
  syncEntrySaveState();
  entryGenerateControl?.refresh();
}

function syncModalOpenState() {
  document.body.classList.toggle("modal-open", !elements.editorPanel.hidden || !elements.siteDialog.hidden);
}

function showSiteDialog() {
  elements.siteDialog.hidden = false;
  elements.siteInput.value = "";
  syncSiteSaveState();
  syncModalOpenState();
  elements.siteInput.focus();
}

function hideSiteDialog() {
  elements.siteDialog.hidden = true;
  elements.siteDialogForm.reset();
  syncSiteSaveState();
  syncModalOpenState();
}

async function saveEntries(nextEntries) {
  const normalizedEntries = nextEntries
    .map(normalizeEntry)
    .slice()
    .sort((a, b) => a.displayTerm.localeCompare(b.displayTerm));

  try {
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ [ENTRIES_KEY]: normalizedEntries }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve();
      });
    });
  } catch (error) {
    showToast("Could not save. The image may be too large for available storage.", "error");
    return false;
  }

  entries = normalizedEntries;
  renderEntries();
  return true;
}

async function saveSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  await storage.set({ [SETTINGS_KEY]: settings });
  renderSettings();
}

async function saveExcludedSites(nextSites) {
  excludedSites = await normalizeExcludedSitesToWholeSiteDomains(nextSites);
  await storage.set({ [EXCLUDED_SITES_KEY]: excludedSites });
  renderExcludedSites();
}

async function getSiteInputDomain() {
  return window.GlowsaryDomains?.getWholeSiteDomainFromInput?.(elements.siteInput.value) || null;
}

async function saveEntry() {
  if (!elements.definitionInput.value.trim()) {
    setDefinitionHint("Definition is required");
    return;
  }

  const validation = validateEntry(elements.termInput.value, elements.definitionInput.value, elements.aliasInput.value, isAliasEnabled());

  if (validation.error) {
    if (validation.error.startsWith("Word ")) {
      setTermHint(validation.error);
      return;
    }

    if (validation.error.startsWith("Alias ")) {
      setAliasHint(validation.error);
      return;
    }

    return;
  }

  const imageValue = normalizeImage(entryImageField?.getValue?.());
  const nextEntry = {
    term: validation.normalizedTerm,
    displayTerm: validation.cleanTerm,
    definition: validation.cleanDefinition,
    aliases: validation.aliases,
    color: entryColorPicker?.getValue?.() || window.GlowsaryColorPicker?.defaultColor || "purple",
    ...(imageValue ? { image: imageValue } : {}),
    createdAt: editingEntry?.createdAt || Date.now()
  };
  const nextEntries = editingEntry
    ? entries.map((entry) => (entry === editingEntry ? nextEntry : entry))
    : entries.concat(nextEntry);

  const saved = await saveEntries(nextEntries);

  if (saved) {
    hideEditor();
  }
}

async function deleteEntry(targetEntry) {
  await saveEntries(entries.filter((entry) => entry !== targetEntry));

  if (editingEntry === targetEntry) {
    hideEditor();
  }
}

function downloadCsv(csvText) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `glowsary-words-${date}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportEntriesToCsv() {
  downloadCsv(serializeEntriesToCsv(entries));
  showToast(`Exported ${entries.length} ${entries.length === 1 ? "entry" : "entries"}.`);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error || new Error("Could not read file.")));
    reader.readAsText(file, "utf-8");
  });
}

async function importEntriesFromFile(file) {
  let rows;

  try {
    rows = parseCsv(await readFileAsText(file));
  } catch (error) {
    showToast("Could not read that CSV file.", "error");
    return;
  }

  const seenKeys = new Set(entries.map(getDuplicateKey));
  const nextImportedEntries = [];
  const importTime = Date.now();
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const row of rows) {
    if (row.length < 2 || row.length > 3) {
      invalidCount += 1;
      continue;
    }

    const validation = validateEntry(row[0], row[1], row[2] || "");

    if (validation.error) {
      invalidCount += 1;
      continue;
    }

    const nextEntry = {
      term: validation.normalizedTerm,
      displayTerm: validation.cleanTerm,
      definition: validation.cleanDefinition,
      aliases: validation.aliases,
      createdAt: importTime
    };
    const duplicateKey = getDuplicateKey(nextEntry);

    if (seenKeys.has(duplicateKey)) {
      duplicateCount += 1;
      continue;
    }

    seenKeys.add(duplicateKey);
    nextImportedEntries.push(nextEntry);
  }

  if (nextImportedEntries.length > 0) {
    await saveEntries(entries.concat(nextImportedEntries));
  }

  showToast(`Import complete: ${nextImportedEntries.length} added, ${duplicateCount} duplicate ${duplicateCount === 1 ? "row" : "rows"} skipped, ${invalidCount} invalid ${invalidCount === 1 ? "row" : "rows"} skipped.`);
}

function renderSettings() {
  elements.sortSelect.value = settings.managementSort === "az" ? "az" : "latest";
  elements.autogenerateLanguageSelect.value = settings.autoGenerateLanguage === "vi" ? "vi" : "en";

  const isCustomKey = settings.autoGenerateKeyMode === "custom";
  for (const radio of elements.autogenerateKeyRadios) {
    radio.checked = radio.value === (isCustomKey ? "custom" : "shared");
  }
  elements.autogenerateCustomKey.hidden = !isCustomKey;
  elements.autogenerateKeyInput.value = settings.autoGenerateCustomKey || "";
}

function hideKeyResult() {
  elements.autogenerateKeyResult.hidden = true;
  elements.autogenerateKeyResult.textContent = "";
  elements.autogenerateKeyResult.classList.remove("is-success", "is-error");
}

function setKeyResult(message, kind) {
  elements.autogenerateKeyResult.textContent = message;
  elements.autogenerateKeyResult.classList.toggle("is-success", kind === "success");
  elements.autogenerateKeyResult.classList.toggle("is-error", kind === "error");
  elements.autogenerateKeyResult.hidden = false;
}

function keyErrorMessage(error) {
  if (error === "network" || error === "runtime") {
    return "Couldn't reach Gemini. Check your connection and try again.";
  }

  return "This key doesn't work. Check it and try again.";
}

let keyCheckRequest = 0;

async function saveAutoGenerateKey() {
  const key = elements.autogenerateKeyInput.value.trim();
  const requestId = ++keyCheckRequest;

  await saveSettings({ ...settings, autoGenerateCustomKey: key });

  if (!key) {
    hideKeyResult();
    return;
  }

  setKeyResult("Checking your key…", "working");
  elements.saveAutogenerateKey.disabled = true;

  const result = await window.GlowsaryAutoGenerate?.checkKey?.(key);

  if (requestId !== keyCheckRequest) {
    return;
  }

  elements.saveAutogenerateKey.disabled = false;

  if (result?.ok) {
    setKeyResult("Your key works.", "success");
    return;
  }

  setKeyResult(keyErrorMessage(result?.error), "error");
}

function getVisibleEntries() {
  const normalizedQuery = normalizeTerm(searchQuery);
  const filteredEntries = normalizedQuery
    ? entries.filter((entry) => normalizeTerm(entry.displayTerm || entry.term).includes(normalizedQuery))
    : entries.slice();

  return filteredEntries.sort((a, b) => {
    if (settings.managementSort === "az") {
      return (a.displayTerm || a.term).localeCompare(b.displayTerm || b.term, undefined, { sensitivity: "base" });
    }

    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function createTextButtonLabel(label) {
  const span = document.createElement("span");
  span.className = "text-button__label";
  span.textContent = label;
  return span;
}

function createAddEntryCard() {
  const card = document.createElement("button");
  card.className = "entry-card entry-card--add";
  card.type = "button";
  card.setAttribute("aria-label", "Add New Word");
  window.GlowsarySemanticColorTokens?.applyWordCardMode?.(card, "addNew");
  card.addEventListener("click", () => showEditor());

  const label = document.createElement("span");
  label.className = "entry-card-add-label";
  label.textContent = "Add New Word";

  const icon = document.createElement("span");
  icon.className = "entry-card-add-icon";
  icon.setAttribute("aria-hidden", "true");

  card.append(label, icon);
  return card;
}

function createAliasChip(alias) {
  const chip = document.createElement("span");
  chip.className = "entry-alias-chip";
  chip.textContent = alias.displayTerm;
  return chip;
}

function createEntryCard(entry) {
  const card = document.createElement("div");
  const color = window.GlowsaryColorPicker?.normalizeColor?.(entry.color) || "purple";
  card.className = `entry-card entry-card--word entry-card--${color}`;
  card.setAttribute("role", "button");
  card.tabIndex = 0;
  card.setAttribute("aria-label", `Edit ${entry.displayTerm || entry.term}`);
  window.GlowsarySemanticColorTokens?.applyWordCardMode?.(card, color);
  card.addEventListener("click", () => showEditor(entry));
  card.addEventListener("keydown", (event) => {
    if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    showEditor(entry);
  });

  const main = document.createElement("span");
  main.className = "entry-card-main";

  const header = document.createElement("span");
  header.className = "entry-card-header";

  const soundButton = document.createElement("button");
  soundButton.className = "entry-card-sound-button";
  soundButton.type = "button";
  soundButton.setAttribute("aria-label", `Pronounce ${entry.displayTerm || entry.term}`);
  soundButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.GlowsarySpeech?.speakEnglish?.(entry.displayTerm || entry.term);
  });

  const soundIcon = document.createElement("span");
  soundIcon.className = "entry-card-sound-icon";
  soundIcon.setAttribute("aria-hidden", "true");
  soundButton.append(soundIcon);

  const term = document.createElement("span");
  term.className = "entry-term";
  term.textContent = entry.displayTerm;

  const definition = document.createElement("span");
  definition.className = "entry-definition";
  definition.textContent = entry.definition;

  header.append(soundButton, term);

  main.append(header, definition);

  const image = normalizeImage(entry.image);

  if (image) {
    const media = document.createElement("div");
    media.className = "entry-card-media is-loading";

    const mediaSkeleton = document.createElement("div");
    mediaSkeleton.className = "entry-card-media-skeleton";
    mediaSkeleton.setAttribute("aria-hidden", "true");

    const mediaImg = document.createElement("img");
    mediaImg.className = "entry-card-media-img";
    mediaImg.alt = "";
    mediaImg.decoding = "async";
    media.append(mediaSkeleton, mediaImg);

    mediaImg.addEventListener("load", () => {
      media.classList.remove("is-loading");
      scheduleEntryGridLayout();
    });
    mediaImg.addEventListener("error", () => {
      media.remove();
      scheduleEntryGridLayout();
    });

    mediaImg.src = image.src;
    main.append(media);
  }

  const aliases = document.createElement("span");
  aliases.className = "entry-aliases";

  for (const alias of normalizeAliasList(entry.aliases)) {
    aliases.append(createAliasChip(alias));
  }

  card.append(main, aliases);
  return card;
}

const MASONRY_ROW_GAP = 16;
let masonryFrame = 0;

function layoutEntryGrid() {
  const cards = elements.entryList?.querySelectorAll(".entry-card");
  if (!cards) {
    return;
  }

  for (const card of cards) {
    const height = card.getBoundingClientRect().height;
    card.style.gridRowEnd = `span ${Math.max(1, Math.ceil(height + MASONRY_ROW_GAP))}`;
  }
}

function scheduleEntryGridLayout() {
  if (masonryFrame) {
    cancelAnimationFrame(masonryFrame);
  }

  masonryFrame = requestAnimationFrame(() => {
    masonryFrame = 0;
    layoutEntryGrid();
  });
}

function renderEntries() {
  const visibleEntries = getVisibleEntries();
  const hasEntries = entries.length > 0;
  const hasSearchMatches = visibleEntries.length > 0;

  // Rebuilding the list empties it for a moment, which collapses the page
  // height and makes the browser snap the scroll back to the top. Saving also
  // re-renders a second time through the storage-change listener, so simply
  // capturing and restoring the scroll position races with that second render.
  // Instead, pin the list to its current height across the rebuild so the page
  // never collapses and the scroll is never lost, then release the pin once the
  // new masonry layout is in place.
  const scroller = document.scrollingElement || document.documentElement;
  const previousScrollTop = scroller.scrollTop;
  const previousListHeight = elements.entryList.getBoundingClientRect().height;

  if (previousListHeight > 0) {
    elements.entryList.style.minHeight = `${previousListHeight}px`;
  }

  elements.entryList.replaceChildren();
  elements.entryList.classList.toggle("entry-list--empty", !hasEntries);
  elements.entryList.append(createAddEntryCard());
  elements.entryCount.textContent = String(entries.length);
  elements.emptyState.hidden = !hasEntries || hasSearchMatches;
  elements.emptyState.textContent = "No matching words.";

  for (const entry of visibleEntries) {
    elements.entryList.append(createEntryCard(entry));
  }

  scheduleEntryGridLayout();

  requestAnimationFrame(() => {
    layoutEntryGrid();
    elements.entryList.style.minHeight = "";
    scroller.scrollTop = previousScrollTop;
  });
}

async function deleteExcludedSite(targetSite) {
  await saveExcludedSites(excludedSites.filter((site) => site !== targetSite));
}

let siteValidationRequest = 0;

async function syncSiteSaveState() {
  const requestId = ++siteValidationRequest;
  const domain = await getSiteInputDomain();

  if (requestId !== siteValidationRequest) {
    return null;
  }

  const isValid = Boolean(domain);
  const hasValue = Boolean(elements.siteInput.value.trim());

  elements.saveSite.disabled = !isValid;
  elements.siteHint.textContent = !isValid && hasValue ? "Please enter valid URL" : "";
  elements.siteHint.classList.toggle("is-error", !isValid && hasValue);

  return domain;
}

async function saveExcludedSiteFromDialog() {
  const domain = await syncSiteSaveState();

  if (!domain) {
    return;
  }

  if (!excludedSites.some((site) => site.domain === domain)) {
    await saveExcludedSites(excludedSites.concat({
      domain,
      createdAt: Date.now()
    }));
  }

  hideSiteDialog();
}

function renderExcludedSites() {
  const visibleSites = excludedSites.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  elements.excludedList.replaceChildren();
  elements.excludedCount.textContent = String(visibleSites.length);
  elements.excludedList.hidden = visibleSites.length === 0;

  for (const site of visibleSites) {
    const row = document.createElement("div");
    row.className = "excluded-row";

    const domain = document.createElement("span");
    domain.className = "excluded-row__domain";
    domain.textContent = site.domain;

    const deleteButton = document.createElement("button");
    deleteButton.className = "excluded-row__delete";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${site.domain}`);
    deleteButton.title = `Delete ${site.domain}`;
    deleteButton.innerHTML = '<span class="excluded-row__delete-icon" aria-hidden="true"></span>';
    deleteButton.addEventListener("click", () => deleteExcludedSite(site));

    row.append(domain, deleteButton);
    elements.excludedList.appendChild(row);
  }
}

function bindEvents() {
  elements.exportEntries.addEventListener("click", exportEntriesToCsv);
  elements.importEntries.addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const [file] = elements.importFile.files;
    elements.importFile.value = "";

    if (file) {
      importEntriesFromFile(file);
    }
  });
  elements.closeEditor.addEventListener("click", hideEditor);
  elements.closeSiteDialog.addEventListener("click", hideSiteDialog);
  elements.siteInput.addEventListener("input", syncSiteSaveState);
  elements.siteDialogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveExcludedSiteFromDialog();
  });
  elements.deleteEntryFromPanel.addEventListener("click", () => {
    if (editingEntry) {
      deleteEntry(editingEntry);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.siteDialog.hidden) {
      hideSiteDialog();
      return;
    }

    if (event.key === "Escape" && !elements.editorPanel.hidden) {
      hideEditor();
    }
  });
  window.addEventListener("resize", scheduleEntryGridLayout);
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEntry();
  });
  elements.termInput.addEventListener("input", syncEntrySaveState);
  elements.definitionInput.addEventListener("input", syncEntrySaveState);
  elements.aliasInput.addEventListener("input", syncEntrySaveState);
  elements.aliasToggle.addEventListener("change", () => {
    syncAliasFieldVisibility();
    setAliasHint();
    syncEntrySaveState();
  });
  elements.searchInput.addEventListener("input", () => {
    searchQuery = elements.searchInput.value;
    renderEntries();
  });
  elements.sortSelect.addEventListener("change", () => {
    saveSettings({
      ...settings,
      managementSort: elements.sortSelect.value
    });
    renderEntries();
  });
  elements.autogenerateLanguageSelect.addEventListener("change", () => {
    saveSettings({
      ...settings,
      autoGenerateLanguage: elements.autogenerateLanguageSelect.value
    });
  });
  for (const radio of elements.autogenerateKeyRadios) {
    radio.addEventListener("change", () => {
      if (!radio.checked) {
        return;
      }

      keyCheckRequest += 1;
      elements.saveAutogenerateKey.disabled = false;
      hideKeyResult();
      saveSettings({
        ...settings,
        autoGenerateKeyMode: radio.value
      });
    });
  }
  elements.autogenerateKeyInput.addEventListener("input", hideKeyResult);
  elements.saveAutogenerateKey.addEventListener("click", saveAutoGenerateKey);

  elements.addExcludedSite.addEventListener("click", showSiteDialog);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[ENTRIES_KEY]) {
      entries = Array.isArray(changes[ENTRIES_KEY].newValue) ? changes[ENTRIES_KEY].newValue.map(normalizeEntry) : [];
      renderEntries();
    }

    if (changes[SETTINGS_KEY]) {
      settings = normalizeSettings(changes[SETTINGS_KEY].newValue || {});
      renderSettings();
      renderEntries();
    }

    if (changes[EXCLUDED_SITES_KEY]) {
      excludedSites = normalizeExcludedSites(changes[EXCLUDED_SITES_KEY].newValue);
      renderExcludedSites();
    }
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
  excludedSites = await normalizeExcludedSitesToWholeSiteDomains(result[EXCLUDED_SITES_KEY]);

  if (JSON.stringify(result[SETTINGS_KEY] || {}) !== JSON.stringify(settings)) {
    await storage.set({ [SETTINGS_KEY]: settings });
  }

  if (JSON.stringify(result[EXCLUDED_SITES_KEY] || []) !== JSON.stringify(excludedSites)) {
    await storage.set({ [EXCLUDED_SITES_KEY]: excludedSites });
  }
}

async function init() {
  initManagementTabNav();
  initEntryColorPicker();
  initEntryImageField();
  initEntryGenerate();
  await loadState();
  renderSettings();
  renderExcludedSites();
  renderEntries();
  bindEvents();
  syncEntrySaveState();
  document.fonts?.ready?.then?.(scheduleEntryGridLayout);
}

init();
