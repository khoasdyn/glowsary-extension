const ENTRIES_KEY = "glowsaryEntries";
const SETTINGS_KEY = "glowsarySettings";
const EXCLUDED_SITES_KEY = "glowsaryExcludedSites";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  revealTrigger: "hover",
  managementSort: "latest"
};

let entries = [];
let settings = { ...DEFAULT_SETTINGS };
let excludedSites = [];
let editingEntry = null;
let searchQuery = "";

const elements = {
  addEntry: document.querySelector("#add-entry"),
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
  triggerInputs: Array.from(document.querySelectorAll("input[name='reveal-trigger']")),
  editorPanel: document.querySelector("#editor-panel"),
  editorTitle: document.querySelector("#editor-title"),
  closeEditor: document.querySelector("#close-editor"),
  cancelEditor: document.querySelector("#cancel-editor"),
  form: document.querySelector("#entry-form"),
  termInput: document.querySelector("#term-input"),
  definitionInput: document.querySelector("#definition-input"),
  aliasInput: document.querySelector("#alias-input"),
  formMessage: document.querySelector("#form-message"),
  entryCount: document.querySelector("#entry-count"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  emptyState: document.querySelector("#empty-state"),
  entryList: document.querySelector("#entry-list"),
  excludedForm: document.querySelector("#excluded-form"),
  excludedInput: document.querySelector("#excluded-input"),
  excludedMessage: document.querySelector("#excluded-message"),
  excludedCount: document.querySelector("#excluded-count"),
  excludedEmpty: document.querySelector("#excluded-empty"),
  excludedList: document.querySelector("#excluded-list")
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
    aliases: normalizeAliasList(entry.aliases)
  };
}

function normalizeExcludedSites(sites = []) {
  return window.GlowsaryDomains?.normalizeExcludedSites?.(sites) || [];
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

function showEditor(entry = null) {
  editingEntry = entry;
  elements.editorTitle.textContent = entry ? "Edit word" : "Add word";
  elements.termInput.value = entry?.displayTerm || "";
  elements.definitionInput.value = entry?.definition || "";
  elements.aliasInput.value = entry ? formatAliases(entry.aliases) : "";
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
  settings = {
    ...DEFAULT_SETTINGS,
    ...nextSettings
  };
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

function renderSettings() {
  elements.highlightingEnabled.checked = Boolean(settings.highlightingEnabled);
  elements.sortSelect.value = settings.managementSort === "az" ? "az" : "latest";

  for (const input of elements.triggerInputs) {
    input.checked = input.value === settings.revealTrigger;
  }
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
    editButton.className = "secondary-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => showEditor(entry));

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
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
    enabled: true,
    createdAt: Date.now()
  }));
  elements.excludedInput.value = "";
  setExcludedMessage(`Added ${domain}.`, "info");
}

async function toggleExcludedSite(targetSite, enabled) {
  await saveExcludedSites(excludedSites.map((site) => (
    site === targetSite
      ? { ...site, enabled }
      : site
  )));
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

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "switch-row excluded-toggle";

    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = site.enabled !== false;
    toggleInput.addEventListener("change", () => toggleExcludedSite(site, toggleInput.checked));

    const toggleText = document.createElement("span");
    const toggleTitle = document.createElement("strong");
    toggleTitle.textContent = "Exclusion";
    const toggleHint = document.createElement("small");
    toggleHint.textContent = toggleInput.checked ? "On" : "Paused";
    toggleText.append(toggleTitle, toggleHint);
    toggleLabel.append(toggleInput, toggleText);

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
    deleteButton.className = "danger-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteExcludedSite(site));

    row.append(toggleLabel, domainInput, deleteButton);
    elements.excludedList.appendChild(row);
  }
}

function bindEvents() {
  elements.addEntry.addEventListener("click", () => showEditor());
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

  for (const input of elements.triggerInputs) {
    input.addEventListener("change", () => {
      if (input.checked) {
        saveSettings({
          ...settings,
          revealTrigger: input.value
        });
      }
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[ENTRIES_KEY]) {
      entries = Array.isArray(changes[ENTRIES_KEY].newValue) ? changes[ENTRIES_KEY].newValue.map(normalizeEntry) : [];
      renderEntries();
    }

    if (changes[SETTINGS_KEY]) {
      settings = {
        ...DEFAULT_SETTINGS,
        ...(changes[SETTINGS_KEY].newValue || {})
      };
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
  settings = {
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_KEY] || {})
  };
  excludedSites = normalizeExcludedSites(result[EXCLUDED_SITES_KEY]);
}

async function init() {
  await loadState();
  renderSettings();
  renderExcludedSites();
  renderEntries();
  bindEvents();
}

init();
