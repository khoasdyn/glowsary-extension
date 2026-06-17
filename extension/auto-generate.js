(function (root) {
  // Shared client for the auto-generate definition action (FR-46). Loaded by both the
  // in-page Add/Edit form (content.js) and the Management form (options.js). It holds no
  // key: it only asks the background service worker to generate, then fills the field.
  const DEFINITION_MAX_LENGTH = 350;
  const FAILURE_MESSAGE = "Couldn't generate a definition. Please type it in.";
  const GENERATE_LABEL = "Auto-generate";
  const LOADING_LABEL = "Generating…";

  function request(word, language) {
    return new Promise((resolve) => {
      try {
        root.chrome?.runtime?.sendMessage?.(
          { type: "GLOWSARY_GENERATE_DEFINITION", word, language },
          (response) => {
            if (root.chrome?.runtime?.lastError || !response) {
              resolve({ ok: false, error: "runtime" });
              return;
            }

            resolve(response);
          }
        );
      } catch (error) {
        resolve({ ok: false, error: "runtime" });
      }
    });
  }

  function attach(options = {}) {
    const button = options.button;
    const termInput = options.termInput;
    const definitionInput = options.definitionInput;
    const getLanguage = typeof options.getLanguage === "function" ? options.getLanguage : () => "en";
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

      const result = await request(termInput.value.trim(), getLanguage());

      setLoading(false);

      if (!result || !result.ok || !result.definition) {
        setError(FAILURE_MESSAGE);
        return;
      }

      definitionInput.value = String(result.definition).slice(0, DEFINITION_MAX_LENGTH);
      definitionInput.dispatchEvent(new Event("input", { bubbles: true }));
      onFilled();
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

  root.GlowsaryAutoGenerate = { attach, request, FAILURE_MESSAGE };
})(globalThis);
