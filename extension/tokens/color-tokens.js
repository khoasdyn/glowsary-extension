(function registerGlowsaryColorTokens(root) {
  const colors = {
    "Lime": {
      "50": { "hex": "#F7FEE7" },
      "100": { "hex": "#ECFCCB" },
      "200": { "hex": "#D9F99D" },
      "300": { "hex": "#BEF264" },
      "400": { "hex": "#A3E635" },
      "500": { "hex": "#84CC16" },
      "600": { "hex": "#65A30D" },
      "700": { "hex": "#4D7C0F" },
      "800": { "hex": "#3F6212" },
      "900": { "hex": "#365314" },
      "950": { "hex": "#1A2E05" }
    },
    "Green": {
      "50": { "hex": "#F0FDF4" },
      "100": { "hex": "#DCFCE7" },
      "200": { "hex": "#BBF7D0" },
      "300": { "hex": "#86EFAC" },
      "400": { "hex": "#4ADE80" },
      "500": { "hex": "#22C55E" },
      "600": { "hex": "#16A34A" },
      "700": { "hex": "#15803D" },
      "800": { "hex": "#166534" },
      "900": { "hex": "#14532D" },
      "950": { "hex": "#052E16" }
    },
    "Emerald": {
      "50": { "hex": "#ECFDF5" },
      "100": { "hex": "#D1FAE5" },
      "200": { "hex": "#A7F3D0" },
      "300": { "hex": "#6EE7B7" },
      "400": { "hex": "#34D399" },
      "500": { "hex": "#10B981" },
      "600": { "hex": "#059669" },
      "700": { "hex": "#047857" },
      "800": { "hex": "#065F46" },
      "900": { "hex": "#064E3B" },
      "950": { "hex": "#022C22" }
    },
    "Teal": {
      "50": { "hex": "#F0FDFA" },
      "100": { "hex": "#CCFBF1" },
      "200": { "hex": "#99F6E4" },
      "300": { "hex": "#5EEAD4" },
      "400": { "hex": "#2DD4BF" },
      "500": { "hex": "#14B8A6" },
      "600": { "hex": "#0D9488" },
      "700": { "hex": "#0F766E" },
      "800": { "hex": "#115E59" },
      "900": { "hex": "#134E4A" },
      "950": { "hex": "#042F2E" }
    },
    "Cyan": {
      "50": { "hex": "#ECFEFF" },
      "100": { "hex": "#CFFAFE" },
      "200": { "hex": "#A5F3FC" },
      "300": { "hex": "#67E8F9" },
      "400": { "hex": "#22D3EE" },
      "500": { "hex": "#06B6D4" },
      "600": { "hex": "#0891B2" },
      "700": { "hex": "#0E7490" },
      "800": { "hex": "#155E75" },
      "900": { "hex": "#164E63" },
      "950": { "hex": "#083344" }
    },
    "Sky": {
      "50": { "hex": "#F0F9FF" },
      "100": { "hex": "#E0F2FE" },
      "200": { "hex": "#BAE6FD" },
      "300": { "hex": "#7DD3FC" },
      "400": { "hex": "#38BDF8" },
      "500": { "hex": "#0EA5E9" },
      "600": { "hex": "#0284C7" },
      "700": { "hex": "#0369A1" },
      "800": { "hex": "#075985" },
      "900": { "hex": "#0C4A6E" },
      "950": { "hex": "#082F49" }
    },
    "Blue": {
      "50": { "hex": "#EFF6FF" },
      "100": { "hex": "#DBEAFE" },
      "200": { "hex": "#BFDBFE" },
      "300": { "hex": "#93C5FD" },
      "400": { "hex": "#60A5FA" },
      "500": { "hex": "#3B82F6" },
      "600": { "hex": "#2563EB" },
      "700": { "hex": "#1D4ED8" },
      "800": { "hex": "#1E40AF" },
      "900": { "hex": "#1E3A8A" },
      "950": { "hex": "#172554" }
    },
    "Indigo": {
      "50": { "hex": "#EEF2FF" },
      "100": { "hex": "#E0E7FF" },
      "200": { "hex": "#C7D2FE" },
      "300": { "hex": "#A5B4FC" },
      "400": { "hex": "#818CF8" },
      "500": { "hex": "#6366F1" },
      "600": { "hex": "#4F46E5" },
      "700": { "hex": "#4338CA" },
      "800": { "hex": "#3730A3" },
      "900": { "hex": "#312E81" },
      "950": { "hex": "#1E1B4B" }
    },
    "Violet": {
      "50": { "hex": "#F5F3FF" },
      "100": { "hex": "#EDE9FE" },
      "200": { "hex": "#DDD6FE" },
      "300": { "hex": "#C4B5FD" },
      "400": { "hex": "#A78BFA" },
      "500": { "hex": "#8B5CF6" },
      "600": { "hex": "#7C3AED" },
      "700": { "hex": "#6D28D9" },
      "800": { "hex": "#5B21B6" },
      "900": { "hex": "#4C1D95" },
      "950": { "hex": "#2E1065" }
    },
    "Purple": {
      "50": { "hex": "#FAF5FF" },
      "100": { "hex": "#F3E8FF" },
      "200": { "hex": "#E9D5FF" },
      "300": { "hex": "#D8B4FE" },
      "400": { "hex": "#C084FC" },
      "500": { "hex": "#A855F7" },
      "600": { "hex": "#9333EA" },
      "700": { "hex": "#7E22CE" },
      "800": { "hex": "#6B21A8" },
      "900": { "hex": "#581C87" },
      "950": { "hex": "#3B0764" }
    },
    "Base": {
      "white": { "hex": "#FFFFFF" },
      "black": { "hex": "#000000" },
      "transparent": { "hex": "#FFFFFF", "alpha": 0, "components": [1, 1, 1] }
    },
    "Neutral": {
      "50": { "hex": "#FAFAFA" },
      "100": { "hex": "#F5F5F5" },
      "200": { "hex": "#E5E5E5" },
      "300": { "hex": "#D4D4D4" },
      "400": { "hex": "#A3A3A3" },
      "500": { "hex": "#737373" },
      "600": { "hex": "#525252" },
      "700": { "hex": "#404040" },
      "800": { "hex": "#262626" },
      "900": { "hex": "#171717" },
      "950": { "hex": "#0A0A0A" }
    },
    "Neutral (alpha)": {
      "50": { "hex": "#FFFFFF", "alpha": 0.9700000286102295, "components": [1, 1, 1] },
      "100": { "hex": "#FFFFFF", "alpha": 0.9599999785423279, "components": [1, 1, 1] },
      "200": { "hex": "#FFFFFF", "alpha": 0.8999999761581421, "components": [1, 1, 1] },
      "300": { "hex": "#FFFFFF", "alpha": 0.8199999928474426, "components": [1, 1, 1] },
      "400": { "hex": "#FFFFFF", "alpha": 0.6200000047683716, "components": [1, 1, 1] },
      "500": { "hex": "#FFFFFF", "alpha": 0.4300000071525574, "components": [1, 1, 1] },
      "600": { "hex": "#FFFFFF", "alpha": 0.28999999165534973, "components": [1, 1, 1] },
      "700": { "hex": "#FFFFFF", "alpha": 0.2199999988079071, "components": [1, 1, 1] },
      "800": { "hex": "#FFFFFF", "alpha": 0.11999999731779099, "components": [1, 1, 1] },
      "900": { "hex": "#FFFFFF", "alpha": 0.05000000074505806, "components": [1, 1, 1] },
      "950": { "hex": "#FFFFFF", "alpha": 0, "components": [1, 1, 1] }
    },
    "Brand": {
      "50": { "hex": "#F9F5FF" },
      "100": { "hex": "#F4EBFF" },
      "200": { "hex": "#E9D7FE" },
      "300": { "hex": "#D6BBFB" },
      "400": { "hex": "#B692F6" },
      "500": { "hex": "#9E77ED" },
      "600": { "hex": "#7F56D9" },
      "700": { "hex": "#6941C6" },
      "800": { "hex": "#53389E" },
      "900": { "hex": "#42307D" },
      "950": { "hex": "#2C1C5F" }
    },
    "Red": {
      "50": { "hex": "#FEF2F2" },
      "100": { "hex": "#FEE2E2" },
      "200": { "hex": "#FECACA" },
      "300": { "hex": "#FCA5A5" },
      "400": { "hex": "#F87171" },
      "500": { "hex": "#EF4444" },
      "600": { "hex": "#DC2626" },
      "700": { "hex": "#B91C1C" },
      "800": { "hex": "#991B1B" },
      "900": { "hex": "#7F1D1D" },
      "950": { "hex": "#450A0A" }
    },
    "Orange": {
      "50": { "hex": "#FFF7ED" },
      "100": { "hex": "#FFEDD5" },
      "200": { "hex": "#FED7AA" },
      "300": { "hex": "#FDBA74" },
      "400": { "hex": "#FB923C" },
      "500": { "hex": "#F97316" },
      "600": { "hex": "#EA580C" },
      "700": { "hex": "#C2410C" },
      "800": { "hex": "#9A3412" },
      "900": { "hex": "#7C2D12" },
      "950": { "hex": "#431407" }
    },
    "Amber": {
      "50": { "hex": "#FFFBEB" },
      "100": { "hex": "#FEF3C7" },
      "200": { "hex": "#FDE68A" },
      "300": { "hex": "#FCD34D" },
      "400": { "hex": "#FBBF24" },
      "500": { "hex": "#F59E0B" },
      "600": { "hex": "#D97706" },
      "700": { "hex": "#B45309" },
      "800": { "hex": "#92400E" },
      "900": { "hex": "#78350F" },
      "950": { "hex": "#451A03" }
    },
    "Yellow": {
      "50": { "hex": "#FEFCE8" },
      "100": { "hex": "#FEF9C3" },
      "200": { "hex": "#FEF08A" },
      "300": { "hex": "#FDE047" },
      "400": { "hex": "#FACC15" },
      "500": { "hex": "#EAB308" },
      "600": { "hex": "#CA8A04" },
      "700": { "hex": "#A16207" },
      "800": { "hex": "#854D0E" },
      "900": { "hex": "#713F12" },
      "950": { "hex": "#422006" }
    },
    "Fuchsia": {
      "50": { "hex": "#FDF4FF" },
      "100": { "hex": "#FAE8FF" },
      "200": { "hex": "#F5D0FE" },
      "300": { "hex": "#F0ABFC" },
      "400": { "hex": "#E879F9" },
      "500": { "hex": "#D946EF" },
      "600": { "hex": "#C026D3" },
      "700": { "hex": "#A21CAF" },
      "800": { "hex": "#86198F" },
      "900": { "hex": "#701A75" },
      "950": { "hex": "#4A044E" }
    },
    "Pink": {
      "50": { "hex": "#FDF2F8" },
      "100": { "hex": "#FCE7F3" },
      "200": { "hex": "#FBCFE8" },
      "300": { "hex": "#F9A8D4" },
      "400": { "hex": "#F472B6" },
      "500": { "hex": "#EC4899" },
      "600": { "hex": "#DB2777" },
      "700": { "hex": "#BE185D" },
      "800": { "hex": "#9D174D" },
      "900": { "hex": "#831843" },
      "950": { "hex": "#500724" }
    },
    "Rose": {
      "50": { "hex": "#FFF1F2" },
      "100": { "hex": "#FFE4E6" },
      "200": { "hex": "#FECDD3" },
      "300": { "hex": "#FDA4AF" },
      "400": { "hex": "#FB7185" },
      "500": { "hex": "#F43F5E" },
      "600": { "hex": "#E11D48" },
      "700": { "hex": "#BE123C" },
      "800": { "hex": "#9F1239" },
      "900": { "hex": "#881337" },
      "950": { "hex": "#4C0519" }
    },
    "Slate": {
      "50": { "hex": "#F8FAFC" },
      "100": { "hex": "#F1F5F9" },
      "200": { "hex": "#E2E8F0" },
      "300": { "hex": "#CBD5E1" },
      "400": { "hex": "#94A3B8" },
      "500": { "hex": "#64748B" },
      "600": { "hex": "#475569" },
      "700": { "hex": "#334155" },
      "800": { "hex": "#1E293B" },
      "900": { "hex": "#0F172A" },
      "950": { "hex": "#020617" }
    },
    "Gray": {
      "50": { "hex": "#F9FAFB" },
      "100": { "hex": "#F3F4F6" },
      "200": { "hex": "#E5E7EB" },
      "300": { "hex": "#D1D5DB" },
      "400": { "hex": "#9CA3AF" },
      "500": { "hex": "#6B7280" },
      "600": { "hex": "#4B5563" },
      "700": { "hex": "#374151" },
      "800": { "hex": "#1F2937" },
      "900": { "hex": "#111827" },
      "950": { "hex": "#030712" }
    },
    "Zinc": {
      "50": { "hex": "#FAFAFA" },
      "100": { "hex": "#F4F4F5" },
      "200": { "hex": "#E4E4E7" },
      "300": { "hex": "#D4D4D8" },
      "400": { "hex": "#A1A1AA" },
      "500": { "hex": "#71717A" },
      "600": { "hex": "#52525B" },
      "700": { "hex": "#3F3F46" },
      "800": { "hex": "#27272A" },
      "900": { "hex": "#18181B" },
      "950": { "hex": "#09090B" }
    },
    "Stone": {
      "50": { "hex": "#FAFAF9" },
      "100": { "hex": "#F5F5F4" },
      "200": { "hex": "#E7E5E4" },
      "300": { "hex": "#D6D3D1" },
      "400": { "hex": "#A8A29E" },
      "500": { "hex": "#78716C" },
      "600": { "hex": "#57534E" },
      "700": { "hex": "#44403C" },
      "800": { "hex": "#292524" },
      "900": { "hex": "#1C1917" },
      "950": { "hex": "#0C0A09" }
    },
    "Taupe": {
      "50": { "hex": "#FBFAF9" },
      "100": { "hex": "#F3F1F1" },
      "200": { "hex": "#E8E4E3" },
      "300": { "hex": "#D8D2D0" },
      "400": { "hex": "#ABA09C" },
      "500": { "hex": "#7C6D67" },
      "600": { "hex": "#5B4F4B" },
      "700": { "hex": "#473C39" },
      "800": { "hex": "#2B2422" },
      "900": { "hex": "#1D1816" },
      "950": { "hex": "#0C0A09" }
    },
    "Mauve": {
      "50": { "hex": "#FAFAFA" },
      "100": { "hex": "#F3F1F3" },
      "200": { "hex": "#E7E4E7" },
      "300": { "hex": "#D7D0D7" },
      "400": { "hex": "#A89EA9" },
      "500": { "hex": "#79697B" },
      "600": { "hex": "#594C5B" },
      "700": { "hex": "#463947" },
      "800": { "hex": "#2A212C" },
      "900": { "hex": "#1D161E" },
      "950": { "hex": "#0C090C" }
    },
    "Mist": {
      "50": { "hex": "#F9FBFB" },
      "100": { "hex": "#F1F3F3" },
      "200": { "hex": "#E3E7E8" },
      "300": { "hex": "#D0D6D8" },
      "400": { "hex": "#9CA8AB" },
      "500": { "hex": "#67787C" },
      "600": { "hex": "#4B585B" },
      "700": { "hex": "#394447" },
      "800": { "hex": "#22292B" },
      "900": { "hex": "#161B1D" },
      "950": { "hex": "#090B0C" }
    },
    "Olive": {
      "50": { "hex": "#FBFBF9" },
      "100": { "hex": "#F4F4F0" },
      "200": { "hex": "#E8E8E3" },
      "300": { "hex": "#D8D8D0" },
      "400": { "hex": "#ABAB9C" },
      "500": { "hex": "#7C7C67" },
      "600": { "hex": "#5B5B4B" },
      "700": { "hex": "#474739" },
      "800": { "hex": "#2B2B22" },
      "900": { "hex": "#1D1D16" },
      "950": { "hex": "#0C0C09" }
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

  function toTokenSegment(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/\(alpha\)/g, "alpha")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function cssVariableName(family, step) {
    return `--color-${toTokenSegment(family)}-${toTokenSegment(step)}`;
  }

  function cssVariable(family, step) {
    return `var(${cssVariableName(family, step)})`;
  }

  function getToken(family, step) {
    return colors[family]?.[step];
  }

  function getCssColorValue(token) {
    if (!token) {
      return "";
    }

    if (token.alpha === undefined || token.alpha === 1) {
      return token.hex;
    }

    return `color(srgb ${token.components.join(" ")} / ${token.alpha})`;
  }

  function buildCssText() {
    const declarations = [];

    for (const [family, steps] of Object.entries(colors)) {
      for (const [step, token] of Object.entries(steps)) {
        declarations.push(`  ${cssVariableName(family, step)}: ${getCssColorValue(token)};`);
      }
    }

    return `:root {\n${declarations.join("\n")}\n}`;
  }

  function injectCssVariables(targetDocument = root.document) {
    if (!targetDocument?.head || targetDocument.getElementById("glowsary-color-tokens")) {
      return;
    }

    const style = targetDocument.createElement("style");
    style.id = "glowsary-color-tokens";
    style.textContent = buildCssText();
    targetDocument.head.prepend(style);
  }

  root.GlowsaryColorTokens = freezeDeep({
    colors,
    cssVariable,
    cssVariableName,
    getCssColorValue,
    getToken,
    injectCssVariables
  });

  injectCssVariables();
})(globalThis);
