const SETTINGS_KEY = "glowsarySettings";
const EXCLUDED_SITES_KEY = "glowsaryExcludedSites";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  revealTrigger: "hover",
  managementSort: "latest"
};

let settings = { ...DEFAULT_SETTINGS };
let excludedSites = [];
let currentSiteDomain = null;

const elements = {
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
  triggerGroup: document.querySelector("#trigger-group"),
  triggerInputs: Array.from(document.querySelectorAll("input[name='reveal-trigger']")),
  excludeSite: document.querySelector("#exclude-site"),
  excludeMessage: document.querySelector("#exclude-message"),
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

function setExcludeMessage(message, kind = "error") {
  elements.excludeMessage.textContent = message;
  elements.excludeMessage.classList.toggle("is-info", kind === "info");
}

function normalizeExcludedSites(sites = []) {
  return window.GlowsaryDomains?.normalizeExcludedSites?.(sites) || [];
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

async function loadCurrentSiteDomain() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  currentSiteDomain = await window.GlowsaryDomains?.getWholeSiteDomainFromInput?.(activeTab?.url || "");
  elements.excludeSite.disabled = !currentSiteDomain;

  if (!currentSiteDomain) {
    setExcludeMessage("This site cannot be excluded.");
  }
}

async function excludeCurrentSite() {
  setExcludeMessage("");

  if (!currentSiteDomain) {
    setExcludeMessage("This site cannot be excluded.");
    return;
  }

  if (excludedSites.some((site) => site.domain === currentSiteDomain)) {
    setExcludeMessage("Already on the list.");
    return;
  }

  const nextSites = excludedSites.concat({
    domain: currentSiteDomain,
    enabled: true,
    createdAt: Date.now()
  });

  excludedSites = nextSites;
  await storage.set({ [EXCLUDED_SITES_KEY]: nextSites });
  setExcludeMessage(`Added ${currentSiteDomain}.`, "info");
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
  elements.excludeSite.addEventListener("click", excludeCurrentSite);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[SETTINGS_KEY]) {
      settings = {
        ...DEFAULT_SETTINGS,
        ...(changes[SETTINGS_KEY].newValue || {})
      };
      renderSettings();
    }

    if (changes[EXCLUDED_SITES_KEY]) {
      excludedSites = normalizeExcludedSites(changes[EXCLUDED_SITES_KEY].newValue);
    }
  });
}

async function loadState() {
  const result = await storage.get({
    [SETTINGS_KEY]: DEFAULT_SETTINGS,
    [EXCLUDED_SITES_KEY]: []
  });

  settings = {
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_KEY] || {})
  };
  excludedSites = normalizeExcludedSites(result[EXCLUDED_SITES_KEY]);
}

async function init() {
  await loadState();
  await loadCurrentSiteDomain();
  renderSettings();
  bindEvents();
}

init();
