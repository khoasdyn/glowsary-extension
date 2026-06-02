const ENTRIES_KEY = "glowsaryEntries";
const SETTINGS_KEY = "glowsarySettings";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  revealTrigger: "hover",
  managementSort: "latest"
};

let entries = [];
let settings = { ...DEFAULT_SETTINGS };
let editingTerm = "";
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
  formMessage: document.querySelector("#form-message"),
  entryCount: document.querySelector("#entry-count"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  emptyState: document.querySelector("#empty-state"),
  entryList: document.querySelector("#entry-list")
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

function validateEntry(displayTerm, definition) {
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

  return {
    cleanTerm,
    cleanDefinition,
    normalizedTerm: normalizeTerm(cleanTerm)
  };
}

function findEntry(term) {
  return entries.find((entry) => entry.term === term);
}

function setMessage(message, kind = "error") {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle("is-info", kind === "info");
}

function showEditor(entry = null) {
  editingTerm = entry?.term || "";
  elements.editorTitle.textContent = entry ? "Edit word" : "Add word";
  elements.termInput.value = entry?.displayTerm || "";
  elements.definitionInput.value = entry?.definition || "";
  setMessage("");
  elements.editorPanel.hidden = false;
  elements.termInput.focus();
}

function hideEditor() {
  elements.editorPanel.hidden = true;
  editingTerm = "";
  elements.form.reset();
  setMessage("");
}

async function saveEntries(nextEntries) {
  entries = nextEntries
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

async function saveEntry() {
  const validation = validateEntry(elements.termInput.value, elements.definitionInput.value);

  if (validation.error) {
    setMessage(validation.error);
    return;
  }

  const existing = findEntry(validation.normalizedTerm);
  const previous = editingTerm ? findEntry(editingTerm) : null;
  const nextEntry = {
    term: validation.normalizedTerm,
    displayTerm: validation.cleanTerm,
    definition: validation.cleanDefinition,
    createdAt: existing?.createdAt || previous?.createdAt || Date.now()
  };
  const nextEntries = entries
    .filter((entry) => entry.term !== validation.normalizedTerm && entry.term !== editingTerm)
    .concat(nextEntry);

  await saveEntries(nextEntries);
  hideEditor();
}

async function deleteEntry(term) {
  await saveEntries(entries.filter((entry) => entry.term !== term));

  if (editingTerm === term) {
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
    deleteButton.addEventListener("click", () => deleteEntry(entry.term));

    actions.append(editButton, deleteButton);
    card.append(term, definition, actions);
    elements.entryList.appendChild(card);
  }
}

function handleTermInput() {
  const normalized = normalizeTerm(elements.termInput.value);
  const duplicate = normalized ? findEntry(normalized) : null;

  if (!duplicate || duplicate.term === editingTerm) {
    return;
  }

  editingTerm = duplicate.term;
  elements.editorTitle.textContent = "Edit word";
  elements.definitionInput.value = duplicate.definition;
  setMessage("Existing entry loaded for editing.", "info");
}

function bindEvents() {
  elements.addEntry.addEventListener("click", () => showEditor());
  elements.closeEditor.addEventListener("click", hideEditor);
  elements.cancelEditor.addEventListener("click", hideEditor);
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEntry();
  });
  elements.termInput.addEventListener("input", handleTermInput);
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
      entries = Array.isArray(changes[ENTRIES_KEY].newValue) ? changes[ENTRIES_KEY].newValue : [];
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
  });
}

async function loadState() {
  const result = await storage.get({
    [ENTRIES_KEY]: [],
    [SETTINGS_KEY]: DEFAULT_SETTINGS
  });

  entries = Array.isArray(result[ENTRIES_KEY]) ? result[ENTRIES_KEY] : [];
  settings = {
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_KEY] || {})
  };
}

async function init() {
  await loadState();
  renderSettings();
  renderEntries();
  bindEvents();
}

init();
