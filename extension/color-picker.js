(function registerGlowsaryColorPicker(root) {
  const COLORS = Object.freeze([
    { value: "purple", fill: "--color-purple-200", check: "--color-purple-800", label: "Purple" },
    { value: "green", fill: "--color-green-200", check: "--color-green-800", label: "Green" },
    { value: "blue", fill: "--color-blue-200", check: "--color-blue-800", label: "Blue" },
    { value: "yellow", fill: "--color-yellow-200", check: "--color-yellow-800", label: "Yellow" }
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
    const icon = root.document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", `${classPrefix}__check`);
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const path = root.document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z");
    path.setAttribute("fill", "currentColor");
    icon.append(path);

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
      button.style.setProperty("--color-picker-fill", `var(${color.fill})`);
      button.style.setProperty("--color-picker-check", `var(${color.check})`);
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", color.label);
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
