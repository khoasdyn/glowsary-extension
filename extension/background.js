importScripts("tokens/color-tokens.js", "auto-generate-config.js");

const CONTEXT_MENU_ID = "glowsary-create-note";
const SETTINGS_KEY = "glowsarySettings";
const DEFAULT_SETTINGS = {
  highlightingEnabled: true,
  managementSort: "latest",
  autoGenerateLanguage: "en",
  // Which key auto-generate uses: the shared key built into the extension, or a custom
  // Gemini key the user pastes in Settings (FR-46j to FR-46m). Defaults to shared.
  autoGenerateKeyMode: "shared",
  autoGenerateCustomKey: ""
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

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) });
    });
  });
}

// One Gemini call shared by the generate action and the key check. Returns the raw text
// on success, or a coarse error tag the callers map to a user message.
async function callGemini(apiKey, prompt, maxOutputTokens) {
  const config = globalThis.GlowsaryAutoGenerateConfig || {};
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
        generationConfig: { temperature: 0.4, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } }
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

  return { ok: true, text };
}

// Resolve the API key for the active key option (FR-46j to FR-46m). Custom with no key
// returns no-custom-key so the action points the user to Settings instead of falling
// back to the shared key.
async function resolveAutoGenerateKey() {
  const config = globalThis.GlowsaryAutoGenerateConfig || {};
  const settings = await getSettings();

  if (settings.autoGenerateKeyMode === "custom") {
    const customKey = String(settings.autoGenerateCustomKey || "").trim();
    return customKey ? { key: customKey } : { error: "no-custom-key" };
  }

  const sharedKey = String(config.apiKey || "").trim();
  return sharedKey ? { key: sharedKey } : { error: "missing-key" };
}

async function generateDefinition(word, languageCode) {
  const config = globalThis.GlowsaryAutoGenerateConfig || {};
  const cleanWord = String(word || "").trim();

  if (cleanWord.length < 3) {
    return { ok: false, error: "invalid-word" };
  }

  const resolved = await resolveAutoGenerateKey();

  if (!resolved.key) {
    return { ok: false, error: resolved.error };
  }

  const languageName = config.languageNames?.[languageCode]
    || config.languageNames?.[config.defaultLanguage]
    || "English";
  const prompt = `Write a short dictionary-style definition of the word or phrase "${cleanWord}" in ${languageName}, for an English learner. Reply with only the definition itself: do not repeat the word, do not add quotes, labels, or extra notes. Keep it under 300 characters.`;

  const result = await callGemini(resolved.key, prompt, 300);

  if (!result.ok) {
    return result;
  }

  const definition = String(result.text || "").replace(/^["']+|["']+$/g, "").trim().slice(0, DEFINITION_MAX_LENGTH).trim();

  if (!definition) {
    return { ok: false, error: "empty" };
  }

  return { ok: true, definition };
}

// Check a custom key with one tiny request (FR-46l). A 200 means the key authenticated
// and has access; it does not generate or save a definition.
async function checkCustomKey(key) {
  const apiKey = String(key || "").trim();

  if (!apiKey) {
    return { ok: false, error: "no-custom-key" };
  }

  const result = await callGemini(apiKey, "Reply with: OK", 5);

  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GLOWSARY_GENERATE_DEFINITION") {
    generateDefinition(message.word, message.language).then(sendResponse);
    return true;
  }

  if (message?.type === "GLOWSARY_CHECK_KEY") {
    checkCustomKey(message.key).then(sendResponse);
    return true;
  }

  return undefined;
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
