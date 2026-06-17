(function (root) {
  const DEFAULT_IDS = {
    form: "entry-form",
    term: "term-input",
    termHint: "term-hint",
    definition: "definition-input",
    definitionHint: "definition-hint",
    alias: "alias-input",
    aliasToggle: "alias-toggle",
    aliasHint: "alias-hint",
    color: "color-picker",
    image: "image-field",
    generate: "generate-definition",
    save: "save-entry",
    delete: "delete-entry-from-panel"
  };

  const ALIAS_HINT_TEXT = "Aliases are other spellings or forms of this word, like \"versions\" for \"version\". They get the same highlight and definition. Separate each with a comma.";

  function className(prefix, base) {
    return prefix ? `${prefix}-${base}` : base;
  }

  function createElement(tagName, options = {}) {
    const element = document.createElement(tagName);

    if (options.className) {
      element.className = options.className;
    }

    if (options.textContent !== undefined) {
      element.textContent = options.textContent;
    }

    for (const [name, value] of Object.entries(options.attributes || {})) {
      if (value !== undefined && value !== null) {
        element.setAttribute(name, String(value));
      }
    }

    return element;
  }

  function createField(config, prefix) {
    const label = createElement("label", { className: config.wrapperClass });
    const labelText = createElement("span", {
      className: className(prefix, "field-input__label"),
      textContent: config.label
    });
    const control = createElement(config.tagName, {
      className: config.controlClass,
      attributes: {
        id: config.id,
        name: config.name,
        autocomplete: config.autocomplete,
        maxlength: config.maxLength,
        placeholder: config.placeholder
      }
    });
    const hint = createElement("p", {
      className: className(prefix, "field-input__hint"),
      textContent: config.hint,
      attributes: { id: config.hintId }
    });

    control.value = config.value || "";
    label.append(labelText, control, hint);

    return { label, control, hint };
  }

  function createDefinitionField(config, prefix) {
    const wrapper = createElement("div", { className: config.wrapperClass });
    const header = createElement("div", { className: className(prefix, "field-input__header") });
    const labelText = createElement("label", {
      className: className(prefix, "field-input__label"),
      textContent: "Definition",
      attributes: { for: config.id }
    });
    const generateButton = createElement("button", {
      className: className(prefix, "field-input__generate"),
      attributes: {
        id: config.generateId,
        type: "button",
        disabled: "",
        "aria-label": "Auto-generate definition"
      }
    });
    generateButton.append(createElement("span", {
      className: className(prefix, "field-input__generate-label"),
      textContent: "Auto-generate",
      attributes: { "data-generate-label": "" }
    }));
    const control = createElement("textarea", {
      className: config.controlClass,
      attributes: {
        id: config.id,
        name: "definition",
        maxlength: 350,
        placeholder: "Describe what this word means"
      }
    });
    const hint = createElement("p", {
      className: className(prefix, "field-input__hint"),
      textContent: "Maximum 350 characters",
      attributes: { id: config.hintId }
    });

    control.value = config.value || "";
    header.append(labelText, generateButton);
    wrapper.append(header, control, hint);

    return { label: wrapper, control, hint, generateButton };
  }

  function createAliasField(config, prefix) {
    const wrapper = createElement("div", { className: config.wrapperClass });
    const header = createElement("div", { className: className(prefix, "field-input__header") });
    const labelText = createElement("label", {
      className: className(prefix, "field-input__label"),
      textContent: "Aliases",
      attributes: { for: config.id }
    });
    const toggle = createElement("input", {
      className: "glowsary-switch",
      attributes: {
        id: config.toggleId,
        type: "checkbox",
        "aria-label": "Show aliases field",
        "aria-controls": config.id
      }
    });
    const control = createElement("input", {
      className: `${config.controlClass} ${className(prefix, "field-input__control--alias")}`,
      attributes: {
        id: config.id,
        name: "alias",
        autocomplete: "off",
        placeholder: "Other spellings, separated by commas"
      }
    });
    const hint = createElement("p", {
      className: className(prefix, "field-input__hint"),
      textContent: ALIAS_HINT_TEXT,
      attributes: { id: config.hintId }
    });

    control.value = config.value || "";
    toggle.checked = Boolean(config.enabled);
    control.hidden = !toggle.checked;
    toggle.setAttribute("aria-expanded", String(toggle.checked));
    const toggleWrapper = createElement("label", {
      className: "glowsary-switch-row glowsary-switch-row--md",
      attributes: { "aria-label": "Show aliases field" }
    });

    toggleWrapper.append(toggle);
    header.append(labelText, toggleWrapper);
    wrapper.append(header, control, hint);

    return { label: wrapper, control, toggle, hint };
  }

  function render(target, options = {}) {
    if (!target) {
      return null;
    }

    const prefix = String(options.classPrefix || "").trim();
    const ids = { ...DEFAULT_IDS, ...(options.ids || {}) };
    const mode = options.mode === "edit" ? "edit" : "add";
    const values = options.values || {};
    const form = createElement("form", {
      className: className(prefix, "entry-form"),
      attributes: { id: ids.form }
    });
    const fields = createElement("div", { className: className(prefix, "entry-form-fields") });
    const fieldClass = className(prefix, "field-input");
    const controlClass = className(prefix, "field-input__control");

    const term = createField({
      wrapperClass: fieldClass,
      controlClass,
      tagName: "input",
      id: ids.term,
      name: "term",
      autocomplete: "off",
      maxLength: 50,
      placeholder: "Enter a word or term",
      label: "Word",
      hint: "Maximum 50 characters",
      hintId: ids.termHint,
      value: values.term
    }, prefix);

    const definition = createDefinitionField({
      wrapperClass: `${fieldClass} ${className(prefix, "multiline-input")}`,
      controlClass: `${controlClass} ${className(prefix, "multiline-input__control")}`,
      id: ids.definition,
      hintId: ids.definitionHint,
      generateId: ids.generate,
      value: values.definition
    }, prefix);

    const aliasValue = values.aliases || "";
    const alias = createAliasField({
      wrapperClass: fieldClass,
      controlClass,
      id: ids.alias,
      toggleId: ids.aliasToggle,
      hintId: ids.aliasHint,
      value: aliasValue,
      enabled: options.aliasEnabled ?? Boolean(String(aliasValue).trim())
    }, prefix);

    const colorField = createElement("div", { className: fieldClass });
    const colorLabel = createElement("span", {
      className: className(prefix, "field-input__label"),
      textContent: "Color"
    });
    const colorPicker = createElement("div", {
      attributes: {
        id: ids.color,
        "aria-label": "Entry color",
        "data-color-picker-value": values.color
      }
    });

    colorField.append(colorLabel, colorPicker);

    const imageField = createElement("div", { className: fieldClass });
    const imageLabel = createElement("span", {
      className: className(prefix, "field-input__label"),
      textContent: "Image"
    });
    const imageMount = createElement("div", {
      className: className(prefix, "image-field-mount"),
      attributes: { id: ids.image }
    });

    imageField.append(imageLabel, imageMount);
    fields.append(term.label, definition.label, alias.label, colorField, imageField);

    const actions = createElement("div", { className: className(prefix, "form-actions") });
    const saveButton = createElement("button", {
      className: `${className(prefix, "text-button")} ${className(prefix, "text-button--default")}`,
      attributes: {
        id: ids.save,
        type: "submit"
      }
    });
    saveButton.append(createElement("span", {
      className: className(prefix, "text-button__label"),
      textContent: "Save"
    }));
    actions.append(saveButton);

    let deleteButton = null;
    function setMode(nextMode) {
      if (deleteButton) {
        deleteButton.hidden = nextMode !== "edit";
      }
    }

    if (options.includeDelete) {
      deleteButton = createElement("button", {
        className: `${className(prefix, "icon-button")} ${className(prefix, "icon-button--destructive")}`,
        attributes: {
          id: ids.delete,
          type: "button",
          "aria-label": "Delete entry",
          title: "Delete entry"
        }
      });
      deleteButton.hidden = mode !== "edit";
      deleteButton.append(createElement("span", {
        className: `${className(prefix, "icon-button__icon")} ${className(prefix, "icon-button__icon--trash")}`,
        attributes: { "aria-hidden": "true" }
      }));
      actions.append(deleteButton);
    }

    setMode(mode);

    form.append(fields, actions);
    target.replaceChildren(form);

    return {
      form,
      termInput: term.control,
      termHint: term.hint,
      definitionInput: definition.control,
      definitionHint: definition.hint,
      generateButton: definition.generateButton,
      aliasInput: alias.control,
      aliasToggle: alias.toggle,
      aliasHint: alias.hint,
      colorPicker,
      imageMount,
      saveButton,
      deleteButton,
      setMode
    };
  }

  root.GlowsaryEntryForm = { render };
})(globalThis);
