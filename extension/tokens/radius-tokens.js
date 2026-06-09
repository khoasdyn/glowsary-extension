(function registerGlowsaryRadiusTokens(root) {
  const radii = {
    cta: "9999px",
    box: "12px",
    "card-sm": "12px",
    "card-md": "24px"
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
    return `--radius-${name}`;
  }

  function cssVariable(name) {
    return `var(${cssVariableName(name)})`;
  }

  function buildCssText() {
    const declarations = Object.entries(radii).map(([name, value]) => `  ${cssVariableName(name)}: ${value};`);

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-radius-tokens")) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-radius-tokens";
    style.textContent = buildCssText();

    const semanticTypographyStyle = targetDocument.getElementById("glowsary-semantic-typography-tokens");
    if (semanticTypographyStyle?.parentNode === targetDocument.head) {
      semanticTypographyStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsaryRadiusTokens = freezeDeep({
    radii,
    buildCssText,
    cssVariable,
    cssVariableName,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
