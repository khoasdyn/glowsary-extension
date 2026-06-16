(function registerGlowsaryImageTokens(root) {
  // PLACEHOLDER VALUES — chosen by Claude because no Figma design exists yet for the image
  // feature. These are the single place to refine the look and compression of saved images.
  // The "dimensions" map below injects CSS variables; the "config" map holds the
  // compression and validation values read by the image-field logic.
  // FR-45b (5MB limit, allowed types) and FR-45d (largest display size) drive these.

  const dimensions = {
    // Thumbnail shown in the definition popup and inside the add/edit form preview.
    "image-thumb-size": "56px",
    // Smaller thumbnail shown in the management word card header, to fit its fixed height.
    "image-thumb-size-card": "40px",
    // Corner radius for every image thumbnail.
    "image-thumb-radius": "var(--card-sm)",
    // The drop area shown before an image is set.
    "image-dropzone-min-height": "92px",
    // Gap between the image controls in the form field.
    "image-field-gap": "8px",
    // Full-size viewer backdrop and image bounds.
    "image-viewer-backdrop": "color-mix(in srgb, var(--color-base-black) 72%, var(--color-base-transparent))",
    "image-viewer-max-width": "90vw",
    "image-viewer-max-height": "90vh"
  };

  const config = {
    // Product rules from PRD.md FR-45b (not placeholders).
    maxBytes: 5 * 1024 * 1024,
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    // PLACEHOLDER compression values (design debt, FR-45b / FR-45d).
    // A local image is shrunk only when its longest edge is larger than this.
    compressOverDimension: 1280,
    // When shrunk, the longest edge is brought down to this, sized for the full-size view.
    targetMaxDimension: 1280,
    // Output format and quality used when a large local image is recompressed.
    compressType: "image/webp",
    compressQuality: 0.82
  };

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }

    return value;
  }

  function cssVariableName(name) {
    return `--${name}`;
  }

  function cssVariable(name) {
    return `var(${cssVariableName(name)})`;
  }

  function buildCssText() {
    const declarations = Object.entries(dimensions).map(([name, value]) => `  ${cssVariableName(name)}: ${value};`);

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-image-tokens")) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-image-tokens";
    style.textContent = buildCssText();

    const radiusStyle = targetDocument.getElementById("glowsary-radius-tokens");
    if (radiusStyle?.parentNode === targetDocument.head) {
      radiusStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsaryImageTokens = freezeDeep({
    dimensions,
    config,
    buildCssText,
    cssVariable,
    cssVariableName,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
