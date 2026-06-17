importScripts("tokens/color-tokens.js", "auto-generate-config.js");

const CONTEXT_MENU_ID = "glowsary-create-note";
const SETTINGS_KEY = "glowsarySettings";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  managementSort: "latest",
  autoGenerateLanguage: "en"
};
const DEFINITION_MAX_LENGTH = 350;
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
    contexts: ["all"]
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

async function generateDefinition(word, languageCode) {
  const config = globalThis.GlowsaryAutoGenerateConfig || {};
  const apiKey = String(config.apiKey || "").trim();

  if (!apiKey) {
    return { ok: false, error: "missing-key" };
  }

  const cleanWord = String(word || "").trim();

  if (cleanWord.length < 3) {
    return { ok: false, error: "invalid-word" };
  }

  const languageName = config.languageNames?.[languageCode]
    || config.languageNames?.[config.defaultLanguage]
    || "English";
  const prompt = `Write a short dictionary-style definition of the word or phrase "${cleanWord}" in ${languageName}, for an English learner. Reply with only the definition itself: do not repeat the word, do not add quotes, labels, or extra notes. Keep it under 300 characters.`;

  let response;

  try {
    response = await fetch(`${config.endpoint}/${config.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // thinkingBudget 0 disables 2.5-flash "thinking", which would otherwise consume
        // the whole output budget and return empty text for a short definition.
        generationConfig: { temperature: 0.4, maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } }
      })
    });
  } catch (error) {
    return { ok: false, error: "network" };
  }

  if (!response.ok) {
    return { ok: false, error: `http-${response.status}` };
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    return { ok: false, error: "bad-response" };
  }

  const text = String(
    data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || ""
  ).trim();
  const definition = text.replace(/^["']+|["']+$/g, "").trim().slice(0, DEFINITION_MAX_LENGTH).trim();

  if (!definition) {
    return { ok: false, error: "empty" };
  }

  return { ok: true, definition };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "GLOWSARY_GENERATE_DEFINITION") {
    return undefined;
  }

  generateDefinition(message.word, message.language).then(sendResponse);
  return true;
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
