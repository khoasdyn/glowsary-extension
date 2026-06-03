const SETTINGS_KEY = "glowsarySettings";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  revealTrigger: "hover",
  managementSort: "latest"
};

let settings = { ...DEFAULT_SETTINGS };

const elements = {
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
  triggerGroup: document.querySelector("#trigger-group"),
  triggerInputs: Array.from(document.querySelectorAll("input[name='reveal-trigger']")),
  openSettings: document.querySelector("#open-settings")
};

const storage = {
  get(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  },
  set(values) {
    return new Promise((resolve) => chrome.storage.local.set(values, resolve));
  }
};

function renderSettings() {
  const highlightingEnabled = Boolean(settings.highlightingEnabled);

  elements.highlightingEnabled.checked = highlightingEnabled;
  elements.triggerGroup.hidden = !highlightingEnabled;

  for (const input of elements.triggerInputs) {
    input.checked = input.value === settings.revealTrigger;
  }
}

async function saveSettings(nextSettings) {
  settings = {
    ...DEFAULT_SETTINGS,
    ...nextSettings
  };
  await storage.set({ [SETTINGS_KEY]: settings });
  renderSettings();
}

async function openManagementView() {
  const optionsUrl = chrome.runtime.getURL("options.html");
  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find((tab) => {
    const tabUrl = tab.url?.split("#")[0];
    return tab.id && tabUrl === optionsUrl;
  });

  if (existingTab) {
    await chrome.tabs.update(existingTab.id, { active: true });
    if (existingTab.windowId) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: optionsUrl });
  }

  window.close();
}

function bindEvents() {
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

  elements.openSettings.addEventListener("click", openManagementView);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[SETTINGS_KEY]) {
      return;
    }

    settings = {
      ...DEFAULT_SETTINGS,
      ...(changes[SETTINGS_KEY].newValue || {})
    };
    renderSettings();
  });
}

async function loadState() {
  const result = await storage.get({
    [SETTINGS_KEY]: DEFAULT_SETTINGS
  });

  settings = {
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_KEY] || {})
  };
}

async function init() {
  await loadState();
  renderSettings();
  bindEvents();
}

init();
