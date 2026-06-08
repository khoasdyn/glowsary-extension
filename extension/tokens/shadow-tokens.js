(function registerGlowsaryShadowTokens(root) {
  const effectColors = {
    "--shadow-xs": {
      primitive: "--color-base-black",
      opacity: 0.05
    },
    "--shadow-skeumorphic-inner": {
      primitive: "--color-base-black",
      opacity: 0.05
    },
    "--shadow-skeumorphic-inner-border": {
      primitive: "--color-base-black",
      opacity: 0.18
    }
  };

  const styles = {
    "--shadow-xs-skeuomorphic": [
      "0 1px 2px 0 var(--shadow-xs)",
      "inset 0 -2px 0 0 var(--shadow-skeumorphic-inner)",
      "inset 0 0 0 1px var(--shadow-skeumorphic-inner-border)"
    ]
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

  function getAvailablePrimitiveNames() {
    const primitiveTokens = root.GlowsaryColorTokens;

    if (!primitiveTokens?.colors || !primitiveTokens.cssVariableName) {
      return null;
    }

    const names = new Set();

    for (const [family, steps] of Object.entries(primitiveTokens.colors)) {
      for (const step of Object.keys(steps)) {
        names.add(primitiveTokens.cssVariableName(family, step));
      }
    }

    return names;
  }

  function getMissingPrimitiveReferences() {
    const availablePrimitiveNames = getAvailablePrimitiveNames();

    if (!availablePrimitiveNames) {
      return [];
    }

    return Object.values(effectColors)
      .map((token) => token.primitive)
      .filter((name) => !availablePrimitiveNames.has(name));
  }

  function getEffectColorValue(token) {
    const percentage = `${token.opacity * 100}%`;

    return `color-mix(in srgb, var(${token.primitive}) ${percentage}, var(--color-base-transparent))`;
  }

  function buildCssText() {
    const declarations = [
      ...Object.entries(effectColors).map(([name, token]) => `  ${name}: ${getEffectColorValue(token)};`),
      ...Object.entries(styles).map(([name, layers]) => `  ${name}: ${layers.join(", ")};`)
    ];

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-shadow-tokens")) {
      return;
    }

    const missingReferences = getMissingPrimitiveReferences();

    if (missingReferences.length) {
      console.error(`Glowsary shadow tokens missing primitives: ${missingReferences.join(", ")}`);
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-shadow-tokens";
    style.textContent = buildCssText();

    const semanticColorStyle = targetDocument.getElementById("glowsary-semantic-color-tokens");
    if (semanticColorStyle?.parentNode === targetDocument.head) {
      semanticColorStyle.after(style);
      return;
    }

    const primitiveStyle = targetDocument.getElementById("glowsary-color-tokens");
    if (primitiveStyle?.parentNode === targetDocument.head) {
      primitiveStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsaryShadowTokens = freezeDeep({
    effectColors,
    styles,
    buildCssText,
    getMissingPrimitiveReferences,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
