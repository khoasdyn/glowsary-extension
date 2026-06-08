(function registerGlowsaryTypographyTokens(root) {
  const fontFamilies = {
    Heading: {
      cssName: "--font-family-heading",
      value: "\"Copse\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    },
    Body: {
      cssName: "--font-family-body",
      value: "\"Poppins\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    }
  };

  const fontWeights = {
    Regular: {
      cssName: "--font-weight-regular",
      value: 400
    },
    Medium: {
      cssName: "--font-weight-medium",
      value: 500
    },
    SemiBold: {
      cssName: "--font-weight-semi-bold",
      value: 600
    }
  };

  const fontSizes = {
    "text-xs": 12,
    "text-sm": 14,
    "text-md": 16,
    "text-lg": 18,
    "text-xl": 20,
    "display-xs": 24,
    "display-sm": 30,
    "display-md": 36,
    "display-lg": 48,
    "display-xl": 60,
    "display-2xl": 72
  };

  const lineHeights = {
    "text-xs": 18,
    "text-sm": 20,
    "text-md": 24,
    "text-lg": 28,
    "text-xl": 30,
    "display-xs": 32,
    "display-sm": 38,
    "display-md": 44,
    "display-lg": 60,
    "display-xl": 72,
    "display-2xl": 90
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

  function cssStepVariableName(prefix, step) {
    return `--${prefix}-${step}`;
  }

  function cssStepVariable(prefix, step) {
    return `var(${cssStepVariableName(prefix, step)})`;
  }

  function getCssVariableNames() {
    return [
      ...Object.values(fontFamilies).map((token) => token.cssName),
      ...Object.values(fontWeights).map((token) => token.cssName),
      ...Object.keys(fontSizes).map((step) => cssStepVariableName("font-size", step)),
      ...Object.keys(lineHeights).map((step) => cssStepVariableName("line-height", step))
    ];
  }

  function buildCssText() {
    const declarations = [
      ...Object.values(fontFamilies).map((token) => `  ${token.cssName}: ${token.value};`),
      ...Object.values(fontWeights).map((token) => `  ${token.cssName}: ${token.value};`),
      ...Object.entries(fontSizes).map(([step, value]) => `  ${cssStepVariableName("font-size", step)}: ${value}px;`),
      ...Object.entries(lineHeights).map(([step, value]) => `  ${cssStepVariableName("line-height", step)}: ${value}px;`)
    ];

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-typography-tokens")) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-typography-tokens";
    style.textContent = buildCssText();

    const semanticColorStyle = targetDocument.getElementById("glowsary-semantic-color-tokens");
    if (semanticColorStyle?.parentNode === targetDocument.head) {
      semanticColorStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsaryTypographyTokens = freezeDeep({
    fontFamilies,
    fontWeights,
    fontSizes,
    lineHeights,
    buildCssText,
    cssStepVariable,
    cssStepVariableName,
    getCssVariableNames,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
