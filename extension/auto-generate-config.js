// Auto-generate definition — service configuration (FR-46).
//
// SINGLE SOURCE for the shared Gemini free-tier key, so it can be swapped in one
// place if the key is blocked (FR-46 decision note, 2026-06-17). This file is loaded
// ONLY by the background service worker (importScripts in background.js). It is never
// loaded into content scripts or the options page, so the shared key is not exposed on
// the web pages the user visits.
//
// SET THE KEY: paste the shared Gemini free-tier API key into apiKey below. While it is
// empty the auto-generate action fails gracefully (FR-46i) and the user can still type
// the definition by hand.
//
// This file is committed with an EMPTY key so the live key is never pushed to the public
// repo. After pasting your key, run this once so git ignores your local edit:
//   git update-index --skip-worktree extension/auto-generate-config.js
// To let git track it again: git update-index --no-skip-worktree extension/auto-generate-config.js

globalThis.GlowsaryAutoGenerateConfig = {
  // Shared Gemini free-tier key. Empty by default — paste the real key here.
  apiKey: "",
  // Free-tier model used for generation. (gemini-2.0-flash had 0 free-tier quota on the
  // shared key; gemini-2.5-flash is the one this key can call.)
  model: "gemini-2.5-flash",
  // Generative Language API base; the model and method are appended at call time.
  endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
  // Language code -> the language name sent in the prompt (FR-46d, FR-46h).
  // To support more languages later, add an entry here and an <option> in options.html.
  languageNames: {
    en: "English",
    vi: "Vietnamese"
  },
  defaultLanguage: "en"
};
