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

    const root_ = createElement(doc, "div", { className: className(prefix, "image-field") });

    const dropzone = createElement(doc, "div", {
      className: className(prefix, "image-field__dropzone"),
      attributes: { role: "button", tabindex: "0", "aria-label": "Add an image" }
    });
    dropzone.append(createElement(doc, "span", {
      className: className(prefix, "image-field__dropzone-text"),
      textContent: "Drag an image here, click to browse, or paste"
    }));
    dropzone.append(createElement(doc, "span", {
      className: className(prefix, "image-field__dropzone-hint"),
      textContent: "PNG, JPEG or WEBP, up to 5MB"
    }));

    const linkRow = createElement(doc, "div", { className: className(prefix, "image-field__link-row") });
    const linkInput = createElement(doc, "input", {
      className: `${className(prefix, "field-input__control")} ${className(prefix, "image-field__link-input")}`,
      attributes: { type: "url", inputmode: "url", autocomplete: "off", placeholder: "Or paste an image link", "aria-label": "Image link" }
    });
    linkRow.append(linkInput);

    const preview = createElement(doc, "div", { className: className(prefix, "image-field__preview"), attributes: { hidden: "" } });
    const thumb = createElement(doc, "span", { className: className(prefix, "image-field__thumb") });
    const thumbImg = createElement(doc, "img", {
      className: className(prefix, "image-field__thumb-img"),
      attributes: { alt: "", decoding: "async" }
    });
    thumb.append(thumbImg);
    const previewBody = createElement(doc, "div", { className: className(prefix, "image-field__preview-body") });
    const previewLabel = createElement(doc, "span", { className: className(prefix, "image-field__preview-label") });
    const previewActions = createElement(doc, "div", { className: className(prefix, "image-field__preview-actions") });
    const replaceButton = createElement(doc, "button", {
      className: className(prefix, "image-field__replace"),
      attributes: { type: "button" },
      textContent: "Replace"
    });
    const removeButton = createElement(doc, "button", {
      className: className(prefix, "image-field__remove"),
      attributes: { type: "button", "aria-label": "Remove image", title: "Remove image" }
    });
    removeButton.append(createElement(doc, "span", {
      className: className(prefix, "image-field__remove-icon"),
      attributes: { "aria-hidden": "true" }
    }));
    previewActions.append(replaceButton, removeButton);
    previewBody.append(previewLabel, previewActions);
    preview.append(thumb, previewBody);

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

    function renderEmpty() {
      preview.hidden = true;
      dropzone.hidden = false;
      linkRow.hidden = false;
    }

    function renderPreview(value) {
      thumbImg.src = value.src;
      previewLabel.textContent = value.type === "link" ? "Linked image" : "Imported image";
      thumb.classList.remove("is-hidden");
      preview.hidden = false;
      dropzone.hidden = true;
      linkRow.hidden = value.type !== "link";
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
      if (!file) {
        return;
      }

      const localRequest = ++requestId;
      setError(null);

      try {
        const dataUrl = await prepareLocalImage(doc, file);

        if (localRequest !== requestId) {
          return;
        }

        linkInput.value = "";
        commit({ type: "local", src: dataUrl });
      } catch (processingError) {
        if (localRequest !== requestId) {
          return;
        }

        setError(processingError?.message || READ_ERROR);
      }
    }

    function handleLinkValue(rawValue) {
      const trimmed = String(rawValue || "").trim();
      requestId += 1;
      setError(null);

      if (!trimmed) {
        commit(null);
        return;
      }

      commit({ type: "link", src: trimmed });
    }

    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
      }
    });
    replaceButton.addEventListener("click", () => fileInput.click());
    removeButton.addEventListener("click", () => {
      requestId += 1;
      linkInput.value = "";
      setError(null);
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
        dropzone.classList.add("is-dragging");
      });
    });
    ["dragleave", "dragend"].forEach((type) => {
      dropzone.addEventListener(type, () => dropzone.classList.remove("is-dragging"));
    });
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
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

    linkInput.addEventListener("input", () => handleLinkValue(linkInput.value));
    linkInput.addEventListener("change", () => handleLinkValue(linkInput.value));

    thumbImg.addEventListener("error", () => {
      if (currentValue?.type === "link") {
        thumb.classList.add("is-hidden");
        setError(LINK_ERROR);
      }
    });
    thumbImg.addEventListener("load", () => {
      thumb.classList.remove("is-hidden");
      if (currentValue?.type === "link") {
        setError(null);
      }
    });

    function setValue(image) {
      requestId += 1;
      setError(null);

      if (image && (image.type === "local" || image.type === "link") && image.src) {
        linkInput.value = image.type === "link" ? image.src : "";
        commit({ type: image.type, src: image.src });
      } else {
        linkInput.value = "";
        commit(null);
      }
    }

    function reset() {
      requestId += 1;
      linkInput.value = "";
      setError(null);
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
