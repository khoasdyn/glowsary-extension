(function registerGlowsaryColorPicker(root) {
  const COLORS = Object.freeze([
    { value: "purple", label: "Purple" },
    { value: "yellow", label: "Yellow" },
    { value: "green", label: "Green" },
    { value: "blue", label: "Blue" }
  ]);
  const DEFAULT_COLOR = COLORS[0].value;
  const COLOR_VALUES = new Set(COLORS.map((color) => color.value));

  function normalizeColor(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return COLOR_VALUES.has(normalized) ? normalized : DEFAULT_COLOR;
  }

  function getButtons(colorPicker) {
    return Array.from(colorPicker.querySelectorAll("[data-color-picker-value]"));
  }

  function createCheckIcon(classPrefix) {
    const icon = root.document.createElement("span");
    icon.className = `${classPrefix}__check`;
    icon.setAttribute("aria-hidden", "true");

    return icon;
  }

  function updateSelection(colorPicker, nextValue, shouldDispatch = false) {
    const selectedValue = normalizeColor(nextValue);

    colorPicker.dataset.colorPickerValue = selectedValue;

    for (const button of getButtons(colorPicker)) {
      const isSelected = button.dataset.colorPickerValue === selectedValue;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-checked", String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
    }

    if (shouldDispatch) {
      colorPicker.dispatchEvent(new CustomEvent("glowsary-color-change", {
        bubbles: true,
        detail: { color: selectedValue }
      }));
    }
  }

  function moveSelection(colorPicker, currentButton, direction) {
    const buttons = getButtons(colorPicker);
    const currentIndex = buttons.indexOf(currentButton);
    const nextButton = buttons[(currentIndex + direction + buttons.length) % buttons.length] || buttons[0];

    updateSelection(colorPicker, nextButton.dataset.colorPickerValue, true);
    nextButton.focus();
  }

  function init(colorPicker, options = {}) {
    if (!colorPicker || colorPicker.dataset.colorPickerReady === "true") {
      return null;
    }

    const classPrefix = String(options.classPrefix || "color-picker").trim();
    const initialValue = normalizeColor(options.value || colorPicker.dataset.colorPickerValue);

    colorPicker.classList.add(classPrefix);
    colorPicker.setAttribute("role", "radiogroup");
    colorPicker.dataset.colorPickerReady = "true";
    colorPicker.replaceChildren();

    for (const color of COLORS) {
      const button = root.document.createElement("button");
      button.type = "button";
      button.className = `${classPrefix}__option`;
      button.dataset.colorPickerValue = color.value;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", color.label);
      root.GlowsarySemanticColorTokens?.applyWordCardMode?.(button, color.value);
      button.append(createCheckIcon(classPrefix));

      button.addEventListener("click", () => updateSelection(colorPicker, color.value, true));
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          moveSelection(colorPicker, button, -1);
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          moveSelection(colorPicker, button, 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          updateSelection(colorPicker, COLORS[0].value, true);
          getButtons(colorPicker)[0]?.focus();
        } else if (event.key === "End") {
          event.preventDefault();
          updateSelection(colorPicker, COLORS[COLORS.length - 1].value, true);
          getButtons(colorPicker)[COLORS.length - 1]?.focus();
        }
      });

      colorPicker.append(button);
    }

    updateSelection(colorPicker, initialValue);

    return {
      getValue: () => normalizeColor(colorPicker.dataset.colorPickerValue),
      setValue: (value) => updateSelection(colorPicker, value),
      element: colorPicker
    };
  }

  root.GlowsaryColorPicker = Object.freeze({
    colors: COLORS,
    defaultColor: DEFAULT_COLOR,
    init,
    normalizeColor
  });
})(globalThis);
