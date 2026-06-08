(function registerGlowsaryIconButton(root) {
  const VARIANTS = new Set(["primary", "secondary", "destructive"]);

  function assertNonEmptyString(value, name) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Glowsary Icon Button requires ${name}.`);
    }
  }

  function assertIcon(icon) {
    if (!icon || !(icon instanceof root.Node)) {
      throw new Error("Glowsary Icon Button requires an icon node.");
    }
  }

  function getClassName(variant, classPrefix) {
    const normalizedVariant = String(variant || "primary").trim().toLowerCase();

    if (!VARIANTS.has(normalizedVariant)) {
      throw new Error(`Glowsary Icon Button variant must be one of: ${Array.from(VARIANTS).join(", ")}.`);
    }

    return `${classPrefix} ${classPrefix}--${normalizedVariant}`;
  }

  function createIconButton({ variant = "primary", icon, accessibleName, tooltip, type = "button", classPrefix = "icon-button" } = {}) {
    assertIcon(icon);
    assertNonEmptyString(accessibleName, "an accessibleName");
    assertNonEmptyString(tooltip, "a tooltip");
    assertNonEmptyString(classPrefix, "a classPrefix");

    const button = root.document.createElement("button");
    button.type = type;
    button.className = getClassName(variant, classPrefix.trim());
    button.setAttribute("aria-label", accessibleName.trim());
    button.title = tooltip.trim();
    icon.classList?.add(`${classPrefix.trim()}__icon`);
    button.append(icon);

    return button;
  }

  root.GlowsaryIconButton = Object.freeze({
    createIconButton,
    variants: Object.freeze(Array.from(VARIANTS))
  });
})(globalThis);
