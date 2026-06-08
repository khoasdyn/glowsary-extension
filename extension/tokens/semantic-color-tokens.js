(function registerGlowsarySemanticColorTokens(root) {
  const modes = {
    light: {
      text: {
        "--text-white": "--color-base-white",
        "--text-primary": "--color-gray-900",
        "--text-tertiary": "--color-gray-600",
        "--text-quaternary": "--color-gray-500",
        "--text-error-primary": "--color-red-700"
      },
      foreground: {
        "--fg-primary": "--color-gray-900",
        "--fg-white": "--color-base-white",
        "--fg-error-white": "--color-red-50",
        "--fg-error-primary": "--color-red-700"
      },
      background: {
        "--bg-primary": "--color-base-white",
        "--bg-primary-solid": "--color-gray-900",
        "--bg-secondary": "--color-gray-50",
        "--bg-tertiary": "--color-gray-100",
        "--bg-quaternary": "--color-gray-200",
        "--bg-error-solid": "--color-red-600"
      },
      border: {
        "--border-primary": "--color-gray-300"
      }
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

  function getPrimitiveReferenceNames(modeName = "light") {
    const mode = modes[modeName];

    if (!mode) {
      return [];
    }

    return Object.values(mode).flatMap((group) => Object.values(group));
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

  function getMissingPrimitiveReferences(modeName = "light") {
    const availablePrimitiveNames = getAvailablePrimitiveNames();

    if (!availablePrimitiveNames) {
      return [];
    }

    return getPrimitiveReferenceNames(modeName).filter((name) => !availablePrimitiveNames.has(name));
  }

  function buildCssText(modeName = "light") {
    const mode = modes[modeName];

    if (!mode) {
      return "";
    }

    const declarations = [];

    for (const group of Object.values(mode)) {
      for (const [name, primitiveName] of Object.entries(group)) {
        declarations.push(`  ${name}: var(${primitiveName});`);
      }
    }

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document, modeName = "light") {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-semantic-color-tokens")) {
      return;
    }

    const missingReferences = getMissingPrimitiveReferences(modeName);

    if (missingReferences.length) {
      console.error(`Glowsary semantic color tokens missing primitives: ${missingReferences.join(", ")}`);
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-semantic-color-tokens";
    style.textContent = buildCssText(modeName);

    const primitiveStyle = targetDocument.getElementById("glowsary-color-tokens");
    if (primitiveStyle?.parentNode === targetDocument.head) {
      primitiveStyle.after(style);
      return;
    }

    targetDocument.head.append(style);
  }

  root.GlowsarySemanticColorTokens = freezeDeep({
    modes,
    buildCssText,
    getMissingPrimitiveReferences,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
