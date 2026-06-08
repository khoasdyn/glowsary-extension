const ENTRIES_KEY = "glowsaryEntries";
const SETTINGS_KEY = "glowsarySettings";
const EXCLUDED_SITES_KEY = "glowsaryExcludedSites";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  excludedSitesEnabled: true,
  managementSort: "latest"
};

let entries = [];
let settings = { ...DEFAULT_SETTINGS };
let excludedSites = [];
let editingEntry = null;
let searchQuery = "";
let activeManagementTab = "home";
let entryColorPicker = null;

const elements = {
  managementTabNav: document.querySelector("#management-tab-nav"),
  managementTabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  addEntry: document.querySelector("#add-entry"),
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
  excludedSitesEnabled: document.querySelector("#excluded-sites-enabled"),
  editorPanel: document.querySelector("#editor-panel"),
  editorTitle: document.querySelector("#editor-title"),
  closeEditor: document.querySelector("#close-editor"),
  cancelEditor: document.querySelector("#cancel-editor"),
  form: document.querySelector("#entry-form"),
  termInput: document.querySelector("#term-input"),
  definitionInput: document.querySelector("#definition-input"),
  aliasInput: document.querySelector("#alias-input"),
  colorPicker: document.querySelector("#color-picker"),
  formMessage: document.querySelector("#form-message"),
  entryCount: document.querySelector("#entry-count"),
  exportEntries: document.querySelector("#export-entries"),
  importEntries: document.querySelector("#import-entries"),
  importFile: document.querySelector("#import-file"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  emptyState: document.querySelector("#empty-state"),
  entryList: document.querySelector("#entry-list"),
  excludedForm: document.querySelector("#excluded-form"),
  excludedInput: document.querySelector("#excluded-input"),
  excludedMessage: document.querySelector("#excluded-message"),
  excludedCount: document.querySelector("#excluded-count"),
  excludedEmpty: document.querySelector("#excluded-empty"),
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

function normalizeEntry(entry) {
  return {
    ...entry,
    color: window.GlowsaryColorPicker?.normalizeColor?.(entry.color) || "purple",
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

function setMessage(message, kind = "error") {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("is-info", kind === "info");
}

function setExcludedMessage(message, kind = "error") {
  elements.excludedMessage.textContent = message;
  elements.excludedMessage.classList.toggle("is-info", kind === "info");
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

function showEditor(entry = null) {
  editingEntry = entry;
  elements.editorTitle.textContent = entry ? "Edit word" : "Add word";
  elements.termInput.value = entry?.displayTerm || "";
  elements.definitionInput.value = entry?.definition || "";
  elements.aliasInput.value = entry ? formatAliases(entry.aliases) : "";
  entryColorPicker?.setValue(entry?.color);
  setMessage("");
  elements.editorPanel.hidden = false;
  document.body.classList.add("modal-open");
  elements.termInput.focus();
}

function hideEditor() {
  elements.editorPanel.hidden = true;
  document.body.classList.remove("modal-open");
  editingEntry = null;
  elements.form.reset();
  setMessage("");
}

async function saveEntries(nextEntries) {
  entries = nextEntries
    .map(normalizeEntry)
    .slice()
    .sort((a, b) => a.displayTerm.localeCompare(b.displayTerm));
  await storage.set({ [ENTRIES_KEY]: entries });
  renderEntries();
}

async function saveSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  await storage.set({ [SETTINGS_KEY]: settings });
  renderSettings();
}

async function saveExcludedSites(nextSites) {
  excludedSites = normalizeExcludedSites(nextSites);
  await storage.set({ [EXCLUDED_SITES_KEY]: excludedSites });
  renderExcludedSites();
}

async function saveEntry() {
  const validation = validateEntry(elements.termInput.value, elements.definitionInput.value, elements.aliasInput.value);

  if (validation.error) {
    setMessage(validation.error);
    return;
  }

  const nextEntry = {
    term: validation.normalizedTerm,
    displayTerm: validation.cleanTerm,
    definition: validation.cleanDefinition,
    aliases: validation.aliases,
    color: entryColorPicker?.getValue?.() || window.GlowsaryColorPicker?.defaultColor || "purple",
    createdAt: editingEntry?.createdAt || Date.now()
  };
  const nextEntries = editingEntry
    ? entries.map((entry) => (entry === editingEntry ? nextEntry : entry))
    : entries.concat(nextEntry);

  await saveEntries(nextEntries);
  hideEditor();
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
  elements.highlightingEnabled.checked = Boolean(settings.highlightingEnabled);
  elements.excludedSitesEnabled.checked = settings.excludedSitesEnabled !== false;
  elements.sortSelect.value = settings.managementSort === "az" ? "az" : "latest";
}

function getVisibleEntries() {
  const normalizedQuery = normalizeTerm(searchQuery);
  const filteredEntries = normalizedQuery
    ? entries.filter((entry) => normalizeTerm(entry.displayTerm || entry.term).includes(normalizedQuery) || entry.term.includes(normalizedQuery))
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

function renderEntries() {
  const visibleEntries = getVisibleEntries();

  elements.entryList.replaceChildren();
  elements.entryCount.textContent = `${visibleEntries.length} ${visibleEntries.length === 1 ? "entry" : "entries"}`;
  elements.emptyState.hidden = visibleEntries.length > 0;
  elements.emptyState.textContent = entries.length === 0 ? "No words saved yet." : "No matching words.";

  for (const entry of visibleEntries) {
    const card = document.createElement("article");
    card.className = "entry-card";

    const term = document.createElement("div");
    term.className = "entry-term";
    term.textContent = entry.displayTerm;

    const definition = document.createElement("div");
    definition.className = "entry-definition";
    definition.textContent = entry.definition;

    const aliases = document.createElement("div");
    aliases.className = "entry-aliases";
    const aliasText = formatAliases(entry.aliases);
    aliases.innerHTML = aliasText ? "<strong>Aliases</strong>" : "";
    if (aliasText) {
      aliases.append(document.createTextNode(aliasText));
    }

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const editButton = document.createElement("button");
    editButton.className = "text-button text-button--secondary";
    editButton.type = "button";
    editButton.append(createTextButtonLabel("Edit"));
    editButton.addEventListener("click", () => showEditor(entry));

    const deleteButton = document.createElement("button");
    deleteButton.className = "text-button text-button--destructive";
    deleteButton.type = "button";
    deleteButton.append(createTextButtonLabel("Delete"));
    deleteButton.addEventListener("click", () => deleteEntry(entry));

    actions.append(editButton, deleteButton);
    card.append(term, definition, aliases, actions);
    elements.entryList.appendChild(card);
  }
}

function isDuplicateExcludedDomain(domain, ignoredSite = null) {
  return excludedSites.some((site) => site !== ignoredSite && site.domain === domain);
}

async function cleanExcludedDomain(value) {
  return window.GlowsaryDomains?.getWholeSiteDomainFromInput?.(value);
}

async function addExcludedSite(value) {
  const domain = await cleanExcludedDomain(value);

  if (!domain) {
    setExcludedMessage("Enter a valid domain.");
    return;
  }

  if (isDuplicateExcludedDomain(domain)) {
    setExcludedMessage("Already on the list.");
    return;
  }

  await saveExcludedSites(excludedSites.concat({
    domain,
    createdAt: Date.now()
  }));
  elements.excludedInput.value = "";
  setExcludedMessage(`Added ${domain}.`, "info");
}

async function toggleExcludedSitesEnabled(enabled) {
  await saveSettings({
    ...settings,
    excludedSitesEnabled: enabled
  });
  setExcludedMessage("");
}

async function deleteExcludedSite(targetSite) {
  await saveExcludedSites(excludedSites.filter((site) => site !== targetSite));
  setExcludedMessage("");
}

async function commitExcludedDomain(input, targetSite) {
  const previousDomain = targetSite.domain;
  const domain = await cleanExcludedDomain(input.value);

  if (!domain || isDuplicateExcludedDomain(domain, targetSite)) {
    input.value = previousDomain;
    setExcludedMessage(domain ? "Already on the list." : "Enter a valid domain.");
    return;
  }

  if (domain === previousDomain) {
    input.value = previousDomain;
    setExcludedMessage("");
    return;
  }

  await saveExcludedSites(excludedSites.map((site) => (
    site === targetSite
      ? { ...site, domain }
      : site
  )));
  setExcludedMessage(`Updated to ${domain}.`, "info");
}

function renderExcludedSites() {
  const visibleSites = excludedSites.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  elements.excludedList.replaceChildren();
  elements.excludedCount.textContent = `${visibleSites.length} ${visibleSites.length === 1 ? "site" : "sites"}`;
  elements.excludedEmpty.hidden = visibleSites.length > 0;

  for (const site of visibleSites) {
    const row = document.createElement("div");
    row.className = "excluded-row";

    const domainInput = document.createElement("input");
    domainInput.className = "excluded-domain-input";
    domainInput.type = "text";
    domainInput.value = site.domain;
    domainInput.autocomplete = "off";
    domainInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        domainInput.blur();
      }
    });
    domainInput.addEventListener("blur", () => commitExcludedDomain(domainInput, site));

    const deleteButton = document.createElement("button");
    deleteButton.className = "text-button text-button--destructive";
    deleteButton.type = "button";
    deleteButton.append(createTextButtonLabel("Delete"));
    deleteButton.addEventListener("click", () => deleteExcludedSite(site));

    row.append(domainInput, deleteButton);
    elements.excludedList.appendChild(row);
  }
}

function bindEvents() {
  elements.addEntry.addEventListener("click", () => showEditor());
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
  elements.cancelEditor.addEventListener("click", hideEditor);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.editorPanel.hidden) {
      hideEditor();
    }
  });
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEntry();
  });
  elements.excludedForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addExcludedSite(elements.excludedInput.value);
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

  elements.highlightingEnabled.addEventListener("change", () => {
    saveSettings({
      ...settings,
      highlightingEnabled: elements.highlightingEnabled.checked
    });
  });

  elements.excludedSitesEnabled.addEventListener("change", () => {
    toggleExcludedSitesEnabled(elements.excludedSitesEnabled.checked);
  });

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
  excludedSites = normalizeExcludedSites(result[EXCLUDED_SITES_KEY]);

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
  await loadState();
  renderSettings();
  renderExcludedSites();
  renderEntries();
  bindEvents();
}

init();
