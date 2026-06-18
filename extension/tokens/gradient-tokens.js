(function registerGlowsaryGradientTokens(root) {
  // Gradient tokens carry the Figma gradient styles, the primitive layer for the
  // gradient category. The generate-CTA gradient is Figma "Gradient/Linear/58"
  // (node 555:3337), a pink-to-purple linear blend used by the special "Generate"
  // button on the Definition field. Components reference the token, never the raw stops.
  const gradients = {
    "gradient-generate": "linear-gradient(135deg, #fa71cd 0%, #c471f5 100%)"
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
    const declarations = Object.entries(gradients).map(([name, value]) => `  ${cssVariableName(name)}: ${value};`);

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-gradient-tokens")) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-gradient-tokens";
    style.textContent = buildCssText();

    const radiusStyle = targetDocument.getElementById("glowsary-radius-tokens");
    if (radiusStyle?.parentNode === targetDocument.head) {
      radiusStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsaryGradientTokens = freezeDeep({
    gradients,
    buildCssText,
    cssVariable,
    cssVariableName,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
