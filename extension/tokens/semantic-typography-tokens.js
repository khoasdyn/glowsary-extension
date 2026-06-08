(function registerGlowsarySemanticTypographyTokens(root) {
  const textStyles = {
    pageTitle: {
      cssPrefix: "--text-style-page-title",
      fontFamily: "--font-family-heading",
      fontWeight: "--font-weight-regular",
      fontSize: "--font-size-display-md",
      lineHeight: "--line-height-display-md"
    },
    sectionTitle: {
      cssPrefix: "--text-style-section-title",
      fontFamily: "--font-family-heading",
      fontWeight: "--font-weight-regular",
      fontSize: "--font-size-display-xs",
      lineHeight: "--line-height-display-xs"
    },
    cardTitle: {
      cssPrefix: "--text-style-card-title",
      fontFamily: "--font-family-heading",
      fontWeight: "--font-weight-regular",
      fontSize: "--font-size-text-lg",
      lineHeight: "--line-height-text-lg"
    },
    subtitlePage: {
      cssPrefix: "--text-style-subtitle-page",
      fontFamily: "--font-family-body",
      fontWeight: "--font-weight-regular",
      fontSize: "--font-size-text-md",
      lineHeight: "--line-height-text-md"
    },
    bodyText: {
      cssPrefix: "--text-style-body-text",
      fontFamily: "--font-family-body",
      fontWeight: "--font-weight-regular",
      fontSize: "--font-size-text-sm",
      lineHeight: "--line-height-text-sm"
    }
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

  function getPrimitiveReferenceNames() {
    return Object.values(textStyles).flatMap((style) => [
      style.fontFamily,
      style.fontWeight,
      style.fontSize,
      style.lineHeight
    ]);
  }

  function getAvailablePrimitiveNames() {
    return root.GlowsaryTypographyTokens?.getCssVariableNames?.() ?? null;
  }

  function getMissingPrimitiveReferences() {
    const availablePrimitiveNames = getAvailablePrimitiveNames();

    if (!availablePrimitiveNames) {
      return [];
    }

    const names = new Set(availablePrimitiveNames);
    return getPrimitiveReferenceNames().filter((name) => !names.has(name));
  }

  function buildCssText() {
    const declarations = [];

    for (const style of Object.values(textStyles)) {
      declarations.push(`  ${style.cssPrefix}-font-family: var(${style.fontFamily});`);
      declarations.push(`  ${style.cssPrefix}-font-weight: var(${style.fontWeight});`);
      declarations.push(`  ${style.cssPrefix}-font-size: var(${style.fontSize});`);
      declarations.push(`  ${style.cssPrefix}-line-height: var(${style.lineHeight});`);
    }

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-semantic-typography-tokens")) {
      return;
    }

    const missingReferences = getMissingPrimitiveReferences();

    if (missingReferences.length) {
      console.error(`Glowsary semantic typography tokens missing primitives: ${missingReferences.join(", ")}`);
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-semantic-typography-tokens";
    style.textContent = buildCssText();

    const typographyStyle = targetDocument.getElementById("glowsary-typography-tokens");
    if (typographyStyle?.parentNode === targetDocument.head) {
      typographyStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsarySemanticTypographyTokens = freezeDeep({
    textStyles,
    buildCssText,
    getMissingPrimitiveReferences,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
