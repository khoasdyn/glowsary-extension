(function registerGlowsarySemanticColorTokens(root) {
  const wordCardModes = {
    addNew: {
      "--wc-bg-alias-chip": "--color-gray-50",
      "--wc-bg-card": "--color-gray-100",
      "--wc-border": "--color-gray-300",
      "--wc-subtext": "--color-gray-500",
      "--wc-underline": "--color-gray-600",
      "--wc-underline-hover": "--color-gray-800",
      "--wc-word-text": "--color-gray-500"
    },
    purple: {
      "--wc-bg-alias-chip": "--color-purple-50",
      "--wc-bg-card": "--color-purple-100",
      "--wc-border": "--color-purple-200",
      "--wc-subtext": "--color-purple-800",
      "--wc-underline": "--color-purple-600",
      "--wc-underline-hover": "--color-purple-800",
      "--wc-word-text": "--color-purple-900"
    },
    yellow: {
      "--wc-bg-alias-chip": "--color-yellow-50",
      "--wc-bg-card": "--color-yellow-100",
      "--wc-border": "--color-yellow-200",
      "--wc-subtext": "--color-yellow-800",
      "--wc-underline": "--color-yellow-600",
      "--wc-underline-hover": "--color-yellow-800",
      "--wc-word-text": "--color-yellow-900"
    },
    green: {
      "--wc-bg-alias-chip": "--color-green-50",
      "--wc-bg-card": "--color-green-100",
      "--wc-border": "--color-green-200",
      "--wc-subtext": "--color-green-800",
      "--wc-underline": "--color-green-600",
      "--wc-underline-hover": "--color-green-800",
      "--wc-word-text": "--color-green-900"
    },
    blue: {
      "--wc-bg-alias-chip": "--color-blue-50",
      "--wc-bg-card": "--color-blue-100",
      "--wc-border": "--color-blue-200",
      "--wc-subtext": "--color-blue-800",
      "--wc-underline": "--color-blue-600",
      "--wc-underline-hover": "--color-blue-800",
      "--wc-word-text": "--color-blue-900"
    }
  };

  const modes = {
    light: {
      text: {
        "--text-white": "--color-base-white",
        "--text-primary": "--color-gray-900",
        "--text-tertiary": "--color-gray-600",
        "--text-quaternary": "--color-gray-500",
        "--text-placeholder": "--color-gray-400",
        "--text-error-primary": "--color-red-700"
      },
      foreground: {
        "--fg-primary": "--color-gray-900",
        "--fg-white": "--color-base-white",
        "--fg-quaternary": "--color-gray-500",
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
        "--border-primary": "--color-gray-300",
        "--border-primary_focus": "--color-gray-900"
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

  function normalizeWordCardMode(modeName) {
    const normalized = String(modeName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const modeAliases = {
      addnew: "addNew",
      purple: "purple",
      yellow: "yellow",
      green: "green",
      blue: "blue"
    };

    return modeAliases[normalized] || "addNew";
  }

  function getPrimitiveReferenceNames(modeName = "light") {
    const mode = modes[modeName];

    if (!mode) {
      return [];
    }

    return [
      ...Object.values(mode).flatMap((group) => Object.values(group)),
      ...Object.values(wordCardModes).flatMap((modeTokens) => Object.values(modeTokens))
    ];
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

  function buildDeclarations(tokenMap) {
    return Object.entries(tokenMap).map(([name, primitiveName]) => `  ${name}: var(${primitiveName});`);
  }

  function buildCssText(modeName = "light") {
    const mode = modes[modeName];

    if (!mode) {
      return "";
    }

    const declarations = [];

    for (const group of Object.values(mode)) {
      declarations.push(...buildDeclarations(group));
    }

    declarations.push(...buildDeclarations(wordCardModes.addNew));

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function applyWordCardMode(element, modeName = "addNew") {
    if (!element?.style) {
      return;
    }

    const mode = wordCardModes[normalizeWordCardMode(modeName)];

    for (const [name, primitiveName] of Object.entries(mode)) {
      element.style.setProperty(name, `var(${primitiveName})`);
    }
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
    wordCardModes,
    applyWordCardMode,
    buildCssText,
    getMissingPrimitiveReferences,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
