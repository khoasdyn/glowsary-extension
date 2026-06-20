(function (root) {
  // Shared client for the auto-generate definition action (FR-46). Loaded by both the
  // in-page Add/Edit form (content.js) and the Management form (options.js). It holds no
  // key: it only asks the background service worker to generate, then fills the field.
  const DEFINITION_MAX_LENGTH = 350;
  // The built-in Auto-generate Prompt (FR-46h). Used as the default for a new user and as
  // the fallback when no prompt is provided. Frontends (options.js, content.js) read it
  // from here so there is one copy for the pages; the service worker keeps its own copy.
  const DEFAULT_PROMPT = "Write a short dictionary-style definition of the word or phrase in Vietnamese, for an English learner. Reply with only the definition itself: do not repeat the word, do not add quotes, labels, or extra notes. Keep it under 300 characters.";
  // Plain-language failure hint per cause (FR-46i). The keys are the internal codes
  // returned by the background service worker; only the values are ever shown to the
  // user, so the cause stays debuggable from the code while the UI stays human.
  const FAILURE_MESSAGES = {
    network: "Can't reach the service.",
    "http-401": "The key was rejected.",
    "http-403": "The key has no access.",
    "http-429": "The daily limit was reached.",
    "http-400": "The request couldn't be processed.",
    "http-404": "The AI model is unavailable.",
    "bad-response": "The reply couldn't be read.",
    empty: "No definition came back.",
    "missing-key": "Auto-generate isn't set up yet.",
    runtime: "Something went wrong."
  };
  // Shown for any 5xx status and for any code not in the map above.
  const SERVICE_ERROR_MESSAGE = "The service is having trouble.";
  const FAILURE_MESSAGE = "Couldn't generate a definition.";
  const KEY_FAILED_MESSAGE = "Your key didn't work, so the shared key was used.";
  const GENERATE_LABEL = "Generate";
  const LOADING_LABEL = "Generating…";

  // Map an internal failure code to the user-facing hint. Unknown codes and 5xx
  // statuses fall back to a safe generic message rather than exposing raw detail.
  function messageForError(code) {
    const key = String(code || "");

    if (FAILURE_MESSAGES[key]) {
      return FAILURE_MESSAGES[key];
    }

    if (/^http-5\d\d$/.test(key)) {
      return SERVICE_ERROR_MESSAGE;
    }

    return FAILURE_MESSAGE;
  }

  function sendMessage(payload) {
    return new Promise((resolve) => {
      try {
        root.chrome?.runtime?.sendMessage?.(payload, (response) => {
          if (root.chrome?.runtime?.lastError || !response) {
            resolve({ ok: false, error: "runtime" });
            return;
          }

          resolve(response);
        });
      } catch (error) {
        resolve({ ok: false, error: "runtime" });
      }
    });
  }

  function request(word, prompt) {
    return sendMessage({ type: "GLOWSARY_GENERATE_DEFINITION", word, prompt });
  }

  function checkKey(key) {
    return sendMessage({ type: "GLOWSARY_CHECK_KEY", key });
  }

  function attach(options = {}) {
    const button = options.button;
    const termInput = options.termInput;
    const definitionInput = options.definitionInput;
    const getPrompt = typeof options.getPrompt === "function" ? options.getPrompt : () => DEFAULT_PROMPT;
    const setError = typeof options.setError === "function" ? options.setError : () => {};
    const onFilled = typeof options.onFilled === "function" ? options.onFilled : () => {};

    if (!button || !termInput || !definitionInput) {
      return null;
    }

    const labelElement = button.querySelector("[data-generate-label]") || button;
    let isLoading = false;

    function hasValidWord() {
      return termInput.value.trim().length >= 3;
    }

    function refresh() {
      button.disabled = isLoading || !hasValidWord();
    }

    function setLoading(next) {
      isLoading = next;
      labelElement.textContent = next ? LOADING_LABEL : GENERATE_LABEL;
      definitionInput.disabled = next;
      button.classList.toggle("is-loading", next);
      refresh();
    }

    async function generate() {
      if (isLoading || !hasValidWord()) {
        return;
      }

      setError(null);
      setLoading(true);

      const result = await request(termInput.value.trim(), getPrompt());

      setLoading(false);

      if (!result || !result.ok || !result.definition) {
        setError(messageForError(result?.error));
        return;
      }

      definitionInput.value = String(result.definition).slice(0, DEFINITION_MAX_LENGTH);
      definitionInput.dispatchEvent(new Event("input", { bubbles: true }));
      onFilled();

      // The validated custom key failed at request time, so the shared key produced this
      // definition; let the user know their key did not work (FR-46q).
      if (result.customKeyFailed) {
        setError(KEY_FAILED_MESSAGE);
      }
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      generate();
    });
    termInput.addEventListener("input", refresh);

    labelElement.textContent = GENERATE_LABEL;
    refresh();

    return { refresh };
  }

  root.GlowsaryAutoGenerate = { attach, request, checkKey, DEFAULT_PROMPT, FAILURE_MESSAGE };
})(globalThis);
