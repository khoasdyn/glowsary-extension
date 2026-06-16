(function (root) {
  function className(prefix, base) {
    return prefix ? `${prefix}-${base}` : base;
  }

  // One viewer at a time per document.
  const activeViewers = new WeakMap();

  function open(src, options = {}) {
    if (!src) {
      return null;
    }

    const doc = options.document || root.document;
    const prefix = String(options.classPrefix || "").trim();
    const host = options.host || doc.documentElement || doc.body;

    if (!host) {
      return null;
    }

    close(doc);

    const backdrop = doc.createElement("div");
    backdrop.className = className(prefix, "image-viewer-backdrop");
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Full-size image");

    const frame = doc.createElement("div");
    frame.className = className(prefix, "image-viewer-frame");

    const image = doc.createElement("img");
    image.className = className(prefix, "image-viewer-image");
    image.alt = "";
    image.decoding = "async";
    image.src = src;

    const closeButton = doc.createElement("button");
    closeButton.type = "button";
    closeButton.className = className(prefix, "image-viewer-close");
    closeButton.setAttribute("aria-label", "Close image");
    closeButton.title = "Close image";
    const closeIcon = doc.createElement("span");
    closeIcon.className = className(prefix, "image-viewer-close__icon");
    closeIcon.setAttribute("aria-hidden", "true");
    closeButton.append(closeIcon);

    frame.append(image, closeButton);
    backdrop.append(frame);

    function handleKeydown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(doc);
      }
    }

    function controllerClose() {
      doc.removeEventListener("keydown", handleKeydown, true);
      backdrop.remove();

      if (activeViewers.get(doc)?.element === backdrop) {
        activeViewers.delete(doc);
      }
    }

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop || event.target === frame) {
        controllerClose();
      }
    });
    closeButton.addEventListener("click", controllerClose);
    // If a linked image is gone by the time the viewer opens, close instead of showing a broken image.
    image.addEventListener("error", controllerClose);
    doc.addEventListener("keydown", handleKeydown, true);

    host.appendChild(backdrop);
    const controller = { element: backdrop, close: controllerClose };
    activeViewers.set(doc, controller);
    closeButton.focus();

    return controller;
  }

  function close(targetDocument = root.document) {
    activeViewers.get(targetDocument)?.close?.();
  }

  root.GlowsaryImageViewer = { open, close };
})(globalThis);
