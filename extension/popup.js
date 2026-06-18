const SETTINGS_KEY = "glowsarySettings";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  managementSort: "latest",
  autoGenerateLanguage: "en",
  autoGenerateCustomKeyEnabled: false,
  autoGenerateCustomKey: ""
};

let settings = { ...DEFAULT_SETTINGS };

const STATUS_COPY = {
  on: {
    title: "Highlighting is on",
    description: "Saved words are highlighted as you read",
    descriptionLines: ["Saved words are highlighted", "as you read"]
  },
  off: {
    title: "Highlighting is off",
    description: "You can still save & manage your words",
    descriptionLines: ["You can still save &", "manage your words"]
  }
};

const elements = {
  statusTitle: document.querySelector("#popup-status-title"),
  statusSubtitle: document.querySelector("#popup-status-subtitle"),
  highlightingEnabled: document.querySelector("#highlighting-enabled"),
  goToApp: document.querySelector("#go-to-app")
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
  const statusCopy = isEnabled ? STATUS_COPY.on : STATUS_COPY.off;

  elements.highlightingEnabled.checked = isEnabled;
  elements.highlightingEnabled.setAttribute("aria-checked", String(isEnabled));
  elements.statusTitle.textContent = statusCopy.title;
  elements.statusSubtitle.setAttribute("aria-label", statusCopy.description);
  elements.statusSubtitle.replaceChildren(
    ...statusCopy.descriptionLines.map((line) => {
      const lineElement = document.createElement("span");
      lineElement.setAttribute("aria-hidden", "true");
      lineElement.textContent = line;
      return lineElement;
    })
  );
}

function normalizeSettings(rawSettings = {}) {
  // Keep this in step with the same function in options.js, including the FR-46s
  // migration, so this context never resurrects the old key fields or clobbers the
  // toggle and validated key when it re-saves settings.
  const isLegacyKeySchema = "autoGenerateKeyMode" in rawSettings;
  return {
    highlightingEnabled: rawSettings.highlightingEnabled !== false,
    managementSort: rawSettings.managementSort === "az" ? "az" : "latest",
    autoGenerateLanguage: rawSettings.autoGenerateLanguage === "vi" ? "vi" : "en",
    autoGenerateCustomKeyEnabled: !isLegacyKeySchema && rawSettings.autoGenerateCustomKeyEnabled === true,
    autoGenerateCustomKey: isLegacyKeySchema || typeof rawSettings.autoGenerateCustomKey !== "string" ? "" : rawSettings.autoGenerateCustomKey
  };
}

async function renderGoToAppIcon() {
  try {
    const response = await fetch(chrome.runtime.getURL("assets/share-03.svg"));
    const svgText = await response.text();
    const template = document.createElement("template");

    template.innerHTML = svgText.trim();
    const icon = template.content.firstElementChild;

    icon.querySelectorAll("[stroke]").forEach((node) => node.setAttribute("stroke", "currentColor"));
    icon.querySelectorAll("[fill]:not([fill='none'])").forEach((node) => node.setAttribute("fill", "currentColor"));
    icon.setAttribute("aria-hidden", "true");
    elements.goToApp.append(icon);
  } catch {
    return;
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

function bindEvents() {
  elements.highlightingEnabled.addEventListener("change", () => {
    saveSettings({
      ...settings,
      highlightingEnabled: elements.highlightingEnabled.checked
    });
  });

  elements.goToApp.addEventListener("click", openManagementView);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[SETTINGS_KEY]) {
      settings = normalizeSettings(changes[SETTINGS_KEY].newValue || {});
      renderSettings();
    }
  });
}

async function loadState() {
  const result = await storage.get({
    [SETTINGS_KEY]: DEFAULT_SETTINGS
  });

  settings = normalizeSettings(result[SETTINGS_KEY] || {});

  if (JSON.stringify(result[SETTINGS_KEY] || {}) !== JSON.stringify(settings)) {
    await storage.set({ [SETTINGS_KEY]: settings });
  }
}

async function init() {
  await renderGoToAppIcon();
  await loadState();
  renderSettings();
  bindEvents();
}

init();
