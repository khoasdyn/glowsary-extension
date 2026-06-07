importScripts("color-tokens.js");

const CONTEXT_MENU_ID = "glowsary-create-note";
const SETTINGS_KEY = "glowsarySettings";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  revealTrigger: "hover",
  managementSort: "latest"
};
const ON_ICON_PATHS = {
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png"
};
const OFF_ICON_PATHS = {
  16: "icons/icon-off-16.png",
  32: "icons/icon-off-32.png",
  48: "icons/icon-off-48.png"
};

function updateToolbarState(settings = DEFAULT_SETTINGS) {
  const highlightingEnabled = settings.highlightingEnabled !== false;
  const badgeText = highlightingEnabled ? "" : "OFF";
  const title = highlightingEnabled ? "Glowsary: highlighting on" : "Glowsary: highlighting off";
  const iconPath = highlightingEnabled ? ON_ICON_PATHS : OFF_ICON_PATHS;

  chrome.action.setIcon({ path: iconPath });
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({
    color: globalThis.GlowsaryColorTokens.getToken("Neutral", "500").hex
  });
  chrome.action.setTitle({ title });
}

function refreshToolbarState() {
  chrome.storage.local.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, (result) => {
    updateToolbarState({
      ...DEFAULT_SETTINGS,
      ...(result[SETTINGS_KEY] || {})
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Add word",
    contexts: ["selection"]
  });
  refreshToolbarState();
});

chrome.runtime.onStartup.addListener(refreshToolbarState);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[SETTINGS_KEY]) {
    return;
  }

  updateToolbarState({
    ...DEFAULT_SETTINGS,
    ...(changes[SETTINGS_KEY].newValue || {})
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "GLOWSARY_OPEN_NOTE",
      selectedText: info.selectionText || ""
    },
    () => {
      chrome.runtime.lastError;
    }
  );
});

refreshToolbarState();
