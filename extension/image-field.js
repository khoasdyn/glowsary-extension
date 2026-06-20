(function (root) {
  function className(prefix, base) {
    return prefix ? `${prefix}-${base}` : base;
  }

  function getConfig() {
    return root.GlowsaryImageTokens?.config || {
      maxBytes: 5 * 1024 * 1024,
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      compressOverDimension: 1280,
      targetMaxDimension: 1280,
      compressType: "image/webp",
      compressQuality: 0.82
    };
  }

  const TYPE_ERROR = "Please choose a PNG, JPEG, or WEBP image.";
  const SIZE_ERROR = "That image is larger than 5MB. Please choose a smaller file.";
  const READ_ERROR = "That image could not be read. Please try another file.";
  const LINK_ERROR = "That link did not load an image. Check the address.";

  function createElement(doc, tagName, options = {}) {
    const element = doc.createElement(tagName);

    if (options.className) {
      element.className = options.className;
    }

    if (options.textContent !== undefined) {
      element.textContent = options.textContent;
    }

    for (const [name, value] of Object.entries(options.attributes || {})) {
      if (value !== undefined && value !== null) {
        element.setAttribute(name, String(value));
      }
    }

    return element;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")));
      reader.addEventListener("error", () => reject(new Error(READ_ERROR)));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(doc, src) {
    return new Promise((resolve, reject) => {
      const image = new (doc.defaultView || root).Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", () => reject(new Error(READ_ERROR)));
      image.src = src;
    });
  }

  // Returns a data URL: the original when small enough, or a shrunk copy when large (FR-45b).
  async function prepareLocalImage(doc, file) {
    const config = getConfig();

    if (!config.allowedTypes.includes(file.type)) {
      throw new Error(TYPE_ERROR);
    }

    if (file.size > config.maxBytes) {
      throw new Error(SIZE_ERROR);
    }

    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(doc, originalDataUrl);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);

    if (!longestEdge || longestEdge <= config.compressOverDimension) {
      return originalDataUrl;
    }

    const scale = config.targetMaxDimension / longestEdge;
    const canvas = doc.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");

    if (!context) {
      return originalDataUrl;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    try {
      return canvas.toDataURL(config.compressType, config.compressQuality);
    } catch (error) {
      return originalDataUrl;
    }
  }

  function init(container, options = {}) {
    if (!container) {
      return null;
    }

    const doc = container.ownerDocument || root.document;
    const prefix = String(options.classPrefix || "").trim();
    const config = getConfig();
    const accept = config.allowedTypes.join(",");

    let currentValue = null;
    let requestId = 0;
    let isProcessing = false;
    let spinnerTimer = null;
    // Short wait before the spinner appears, so fast images never flash it (FR-45j).
    const SPINNER_DELAY = 150;

    const root_ = createElement(doc, "div", { className: className(prefix, "image-field") });

    // Empty state, top box: a drop area that takes a local file by click, drag, or paste.
    // It shows only a photo icon and the format hint; the spinner replaces them while busy.
    const dropzone = createElement(doc, "div", {
      className: className(prefix, "image-field__dropzone"),
      attributes: { role: "button", tabindex: "0", "aria-label": "Add an image" }
    });
    dropzone.append(createElement(doc, "span", {
      className: className(prefix, "image-field__dropzone-icon"),
      attributes: { "aria-hidden": "true" }
    }));
    dropzone.append(createElement(doc, "span", {
      className: className(prefix, "image-field__dropzone-hint"),
      textContent: "PNG, JPEG or WEBP, up to 5MB"
    }));
    const dropzoneProcessing = createElement(doc, "span", {
      className: className(prefix, "image-field__processing")
    });
    dropzoneProcessing.append(createElement(doc, "span", {
      className: className(prefix, "image-field__spinner"),
      attributes: { "aria-hidden": "true" }
    }));
    dropzoneProcessing.append(createElement(doc, "span", {
      className: className(prefix, "image-field__processing-label"),
      textContent: "Processing image"
    }));
    dropzone.append(dropzoneProcessing);

    // Empty state, bottom row: a link input and a round submit button (FR-45c, FR-45e).
    const linkRow = createElement(doc, "div", { className: className(prefix, "image-field__link-row") });
    const linkInput = createElement(doc, "input", {
      className: `${className(prefix, "field-input__control")} ${className(prefix, "image-field__link-input")}`,
      attributes: { type: "url", inputmode: "url", autocomplete: "off", placeholder: "Or paste an image link", "aria-label": "Image link" }
    });
    const linkSubmit = createElement(doc, "button", {
      className: className(prefix, "image-field__link-submit"),
      attributes: { type: "button", disabled: "", "aria-label": "Add image from link", title: "Add image from link" }
    });
    linkSubmit.append(createElement(doc, "span", {
      className: className(prefix, "image-field__link-submit-icon"),
      attributes: { "aria-hidden": "true" }
    }));
    linkRow.append(linkInput, linkSubmit);

    // Uploaded state: the whole image is shown inside a fixed box. Hovering it dims the
    // image and reveals a round delete button (FR-45d, FR-45e).
    const preview = createElement(doc, "div", { className: className(prefix, "image-field__preview"), attributes: { hidden: "" } });
    const previewImg = createElement(doc, "img", {
      className: className(prefix, "image-field__preview-img"),
      attributes: { alt: "", decoding: "async" }
    });
    // An edited entry whose saved image no longer loads shows the error placeholder in place of the
    // image, while the hover delete overlay still works so the broken image can be removed (FR-45g).
    previewImg.addEventListener("error", () => {
      preview.classList.add("is-error");
    });
    const previewPlaceholder = createElement(doc, "div", {
      className: className(prefix, "image-field__preview-placeholder")
    });
    previewPlaceholder.append(createElement(doc, "span", {
      className: className(prefix, "image-field__preview-placeholder-icon"),
      attributes: { "aria-hidden": "true" }
    }));
    previewPlaceholder.append(createElement(doc, "span", {
      className: className(prefix, "image-field__preview-placeholder-text"),
      textContent: "Error loading this image."
    }));
    const previewOverlay = createElement(doc, "span", {
      className: className(prefix, "image-field__preview-overlay"),
      attributes: { "aria-hidden": "true" }
    });
    const removeButton = createElement(doc, "button", {
      className: className(prefix, "image-field__remove"),
      attributes: { type: "button", "aria-label": "Remove image", title: "Remove image" }
    });
    removeButton.append(createElement(doc, "span", {
      className: className(prefix, "image-field__remove-icon"),
      attributes: { "aria-hidden": "true" }
    }));
    previewOverlay.append(removeButton);
    preview.append(previewImg, previewPlaceholder, previewOverlay);

    const error = createElement(doc, "p", {
      className: `${className(prefix, "field-input__hint")} ${className(prefix, "image-field__error")}`,
      attributes: { role: "alert", hidden: "" }
    });

    const fileInput = createElement(doc, "input", {
      className: className(prefix, "image-field__file-input"),
      attributes: { type: "file", accept, hidden: "" }
    });

    root_.append(dropzone, linkRow, preview, error, fileInput);
    container.replaceChildren(root_);

    function setError(message) {
      if (message) {
        error.textContent = message;
        error.classList.add("is-error");
        error.hidden = false;
      } else {
        error.textContent = "";
        error.classList.remove("is-error");
        error.hidden = true;
      }
    }

    // The submit button is active only when the input has text and nothing is processing.
    function syncSubmitState() {
      linkSubmit.disabled = isProcessing || !linkInput.value.trim();
    }

    function clearSpinnerTimer() {
      if (spinnerTimer !== null) {
        clearTimeout(spinnerTimer);
        spinnerTimer = null;
      }
    }

    // Lock the field and arm the delayed spinner inside the box (FR-45j). The same flow runs
    // for a local file (read, decode, shrink) and a pasted link (loading from the web).
    function startProcessing() {
      isProcessing = true;
      syncSubmitState();
      clearSpinnerTimer();
      spinnerTimer = setTimeout(() => {
        spinnerTimer = null;

        if (!isProcessing) {
          return;
        }

        dropzone.classList.add("is-processing");
      }, SPINNER_DELAY);
    }

    // Clear processing state and any spinner; safe to call when not processing.
    function stopProcessing() {
      isProcessing = false;
      clearSpinnerTimer();
      dropzone.classList.remove("is-processing");
      syncSubmitState();
    }

    function renderEmpty() {
      preview.hidden = true;
      dropzone.hidden = false;
      linkRow.hidden = false;
    }

    function renderPreview(value) {
      // Reset the error state before trying a new image, so a recovered link shows the real image.
      preview.classList.remove("is-error");
      previewImg.src = value.src;
      preview.hidden = false;
      dropzone.hidden = true;
      linkRow.hidden = true;
    }

    function commit(value) {
      currentValue = value;

      if (!value) {
        renderEmpty();
        return;
      }

      renderPreview(value);
    }

    async function handleFile(file) {
      if (!file || isProcessing) {
        return;
      }

      const localRequest = ++requestId;
      setError(null);
      startProcessing();

      try {
        const dataUrl = await prepareLocalImage(doc, file);

        if (localRequest !== requestId) {
          return;
        }

        linkInput.value = "";
        syncSubmitState();
        commit({ type: "local", src: dataUrl });
      } catch (processingError) {
        if (localRequest !== requestId) {
          return;
        }

        // A bad local file returns the field to the empty state with a message (FR-45f, FR-45j).
        setError(processingError?.message || READ_ERROR);
        commit(null);
      } finally {
        if (localRequest === requestId) {
          stopProcessing();
        }
      }
    }

    // The link loads only on submit or Enter (FR-45e). The spinner shows while it loads; a
    // link that does not load returns the field to the empty state with a message (FR-45j).
    async function handleLinkSubmit() {
      const trimmed = linkInput.value.trim();

      if (!trimmed || isProcessing) {
        return;
      }

      const localRequest = ++requestId;
      setError(null);
      startProcessing();

      try {
        await loadImage(doc, trimmed);

        if (localRequest !== requestId) {
          return;
        }

        commit({ type: "link", src: trimmed });
      } catch (loadError) {
        if (localRequest !== requestId) {
          return;
        }

        setError(LINK_ERROR);
        linkInput.value = "";
        syncSubmitState();
        commit(null);
      } finally {
        if (localRequest === requestId) {
          stopProcessing();
        }
      }
    }

    dropzone.addEventListener("click", () => {
      if (isProcessing) {
        return;
      }
      fileInput.click();
    });
    dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (isProcessing) {
          return;
        }
        fileInput.click();
      }
    });
    removeButton.addEventListener("click", () => {
      requestId += 1;
      stopProcessing();
      linkInput.value = "";
      setError(null);
      syncSubmitState();
      commit(null);
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      handleFile(file);
    });

    ["dragenter", "dragover"].forEach((type) => {
      dropzone.addEventListener(type, (event) => {
        event.preventDefault();
        if (isProcessing) {
          return;
        }
        dropzone.classList.add("is-dragging");
      });
    });
    ["dragleave", "dragend"].forEach((type) => {
      dropzone.addEventListener(type, () => dropzone.classList.remove("is-dragging"));
    });
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      if (isProcessing) {
        return;
      }
      dropzone.classList.remove("is-dragging");
      const file = event.dataTransfer?.files && event.dataTransfer.files[0];
      handleFile(file);
    });

    root_.addEventListener("paste", (event) => {
      const items = event.clipboardData?.items || [];

      for (const item of items) {
        if (item.kind === "file" && String(item.type || "").startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    });

    linkInput.addEventListener("input", syncSubmitState);
    linkInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleLinkSubmit();
      }
    });
    linkSubmit.addEventListener("click", handleLinkSubmit);

    // Defensive: if a committed link image still fails in the box, return to empty (FR-45e).
    previewImg.addEventListener("error", () => {
      if (currentValue?.type === "link") {
        setError(LINK_ERROR);
        linkInput.value = "";
        syncSubmitState();
        commit(null);
      }
    });

    function setValue(image) {
      requestId += 1;
      stopProcessing();
      linkInput.value = "";
      setError(null);
      syncSubmitState();

      if (image && (image.type === "local" || image.type === "link") && image.src) {
        commit({ type: image.type, src: image.src });
      } else {
        commit(null);
      }
    }

    function reset() {
      requestId += 1;
      stopProcessing();
      linkInput.value = "";
      setError(null);
      syncSubmitState();
      commit(null);
    }

    setValue(options.value || null);

    return {
      element: root_,
      getValue: () => (currentValue ? { ...currentValue } : null),
      setValue,
      reset
    };
  }

  root.GlowsaryImageField = { init };
})(globalThis);
