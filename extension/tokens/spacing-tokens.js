(function registerGlowsarySpacingTokens(root) {
  const spacing = {
    "section-gap": "64px",
    "field-gap": "24px",
    "label-field": "6px",
    "button-gap": "8px"
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
    const declarations = Object.entries(spacing).map(([name, value]) => `  ${cssVariableName(name)}: ${value};`);

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-spacing-tokens")) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-spacing-tokens";
    style.textContent = buildCssText();

    const radiusStyle = targetDocument.getElementById("glowsary-radius-tokens");
    if (radiusStyle?.parentNode === targetDocument.head) {
      radiusStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsarySpacingTokens = freezeDeep({
    spacing,
    buildCssText,
    cssVariable,
    cssVariableName,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
