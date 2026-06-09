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
  statusTitle: document.querySelector("#popup-status-title"),
  statusSubtitle: document.querySelector("#popup-status-subtitle"),
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
  excludeSite: document.querySelector("#exclude-site"),
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
  const isEnabled = Boolean(settings.highlightingEnabled);

  elements.highlightingEnabled.checked = isEnabled;
  elements.highlightingEnabled.setAttribute("aria-checked", String(isEnabled));
  elements.statusTitle.textContent = isEnabled ? "Extension is active" : "Extension is inactive";
  elements.statusSubtitle.textContent = isEnabled ? "Show saved words on webpages" : "Saved words are hidden";
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
  return !currentSiteDomain || excludedSites.some((site) => site.domain === currentSiteDomain);
}

function renderExcludeButton() {
  const isExcluded = isCurrentSiteExcluded();
  const label = elements.excludeSite.querySelector(".text-button__label");

  label.textContent = isExcluded ? "This site is excluded" : "Exclude this site";
  elements.excludeSite.disabled = isExcluded;
  elements.excludeSite.classList.toggle("is-excluded", isExcluded);
}

async function renderSettingsButtonIcon() {
  try {
    const response = await fetch(chrome.runtime.getURL("assets/settings-02.svg"));
    const svgText = await response.text();
    const template = document.createElement("template");

    template.innerHTML = svgText.trim();
    const icon = template.content.firstElementChild;

    icon.querySelectorAll("[stroke]").forEach((node) => node.setAttribute("stroke", "currentColor"));
    icon.querySelectorAll("[fill]:not([fill='none'])").forEach((node) => node.setAttribute("fill", "currentColor"));
    icon.setAttribute("aria-hidden", "true");
    elements.openSettings.replaceChildren(icon);
  } catch {
    elements.openSettings.textContent = "";
  }
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
  renderExcludeButton();
}

async function excludeCurrentSite() {
  if (!currentSiteDomain) {
    renderExcludeButton();
    return;
  }

  if (excludedSites.some((site) => site.domain === currentSiteDomain)) {
    renderExcludeButton();
    return;
  }

  const nextSites = excludedSites.concat({
    domain: currentSiteDomain,
    createdAt: Date.now()
  });

  excludedSites = nextSites;
  await storage.set({ [EXCLUDED_SITES_KEY]: nextSites });
  renderExcludeButton();
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
      renderExcludeButton();
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
  await renderSettingsButtonIcon();
  await loadState();
  await loadCurrentSiteDomain();
  renderSettings();
  renderExcludeButton();
  bindEvents();
}

init();
