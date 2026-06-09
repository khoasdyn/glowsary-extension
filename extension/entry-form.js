(function (root) {
  const DEFAULT_IDS = {
    form: "entry-form",
    term: "term-input",
    termHint: "term-hint",
    definition: "definition-input",
    definitionHint: "definition-hint",
    alias: "alias-input",
    aliasHint: "alias-hint",
    color: "color-picker",
    save: "save-entry",
    delete: "delete-entry-from-panel"
  };

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
      hint: "Max 50 characters",
      hintId: ids.termHint,
      value: values.term
    }, prefix);

    const definition = createField({
      wrapperClass: `${fieldClass} ${className(prefix, "multiline-input")}`,
      controlClass: `${controlClass} ${className(prefix, "multiline-input__control")}`,
      tagName: "textarea",
      id: ids.definition,
      name: "definition",
      maxLength: 350,
      placeholder: "Describe what this word means",
      label: "Definition",
      hint: "Max 350 characters",
      hintId: ids.definitionHint,
      value: values.definition
    }, prefix);

    const alias = createField({
      wrapperClass: fieldClass,
      controlClass,
      tagName: "input",
      id: ids.alias,
      name: "alias",
      autocomplete: "off",
      placeholder: "versions, versioned",
      label: "Aliases",
      hint: "Optional, comma separated",
      hintId: ids.aliasHint,
      value: values.aliases
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
    fields.append(term.label, definition.label, alias.label, colorField);

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
      aliasInput: alias.control,
      aliasHint: alias.hint,
      colorPicker,
      saveButton,
      deleteButton,
      setMode
    };
  }

  root.GlowsaryEntryForm = { render };
})(globalThis);
