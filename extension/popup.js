const SETTINGS_KEY = "glowsarySettings";
const EXCLUDED_SITES_KEY = "glowsaryExcludedSites";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  excludedSitesEnabled: true,
  managementSort: "latest"
};

let settings = { ...DEFAULT_SETTINGS };
let excludedSites = [];
let currentSiteDomain = null;

const elements = {
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
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
  elements.highlightingEnabled.checked = Boolean(settings.highlightingEnabled);
}

function setExcludeMessage(message, kind = "error") {
  elements.excludeMessage.textContent = message;
  elements.excludeMessage.classList.toggle("is-info", kind === "info");
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

async function saveSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
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

  elements.openSettings.addEventListener("click", openManagementView);
  elements.excludeSite.addEventListener("click", excludeCurrentSite);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[SETTINGS_KEY]) {
      settings = normalizeSettings(changes[SETTINGS_KEY].newValue || {});
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
  await loadState();
  await loadCurrentSiteDomain();
  renderSettings();
  bindEvents();
}

init();
