// Shared, surface-agnostic helpers for word entries (FR-2, FR-3a–FR-3d). These pure
// functions used to be copy-pasted into content.js, pdf-reader.js, and options.js, which
// is how a fix could land on one surface and silently miss another. They live here once
// so the in-page form, the PDF reader, and the Management panel all share one copy.
//
// Only logic with no surface-specific state belongs here: text cleanup, term and alias
// normalization, alias parsing, entry validation, and image normalization. The save,
// update, and delete flows stay per-surface because each ends in its own state update
// and re-render.
(function (root) {
  function collapseSpaces(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function normalizeTerm(value) {
    return collapseSpaces(value).toLowerCase();
  }

  function normalizeAliasList(aliases = []) {
    return aliases.map((alias) => ({
      term: normalizeTerm(alias.term || alias.displayTerm || alias),
      displayTerm: collapseSpaces(alias.displayTerm || alias.term || alias)
    })).filter((alias) => alias.term && alias.displayTerm);
  }

  function formatAliases(aliases = []) {
    return normalizeAliasList(aliases).map((alias) => alias.displayTerm).join(", ");
  }

  function normalizeImage(image) {
    if (!image || typeof image !== "object") {
      return undefined;
    }

    const type = image.type === "link" ? "link" : image.type === "local" ? "local" : null;
    const src = typeof image.src === "string" ? image.src.trim() : "";

    if (!type || !src) {
      return undefined;
    }

    return { type, src };
  }

  function parseAliases(value, normalizedTerm) {
    const aliases = [];
    const seen = new Set();

    for (const rawAlias of String(value || "").split(",")) {
      const displayTerm = collapseSpaces(rawAlias);

      if (!displayTerm) {
        continue;
      }

      if (displayTerm.length < 3) {
        return { error: `Alias "${displayTerm}" must be at least 3 characters.` };
      }

      const term = normalizeTerm(displayTerm);

      if (term === normalizedTerm || seen.has(term)) {
        continue;
      }

      seen.add(term);
      aliases.push({ term, displayTerm });
    }

    return { aliases };
  }

  function validateEntry(displayTerm, definition, aliasText = "", aliasEnabled = true) {
    const cleanTerm = collapseSpaces(displayTerm);
    const cleanDefinition = String(definition || "").trim();

    if (!cleanTerm) {
      return { error: "Word is required." };
    }

    if (cleanTerm.length < 3) {
      return { error: "Word must be at least 3 characters." };
    }

    if (!cleanDefinition) {
      return { error: "Definition is required." };
    }

    const normalizedTerm = normalizeTerm(cleanTerm);
    const aliasResult = aliasEnabled ? parseAliases(aliasText, normalizedTerm) : { aliases: [] };

    if (aliasResult.error) {
      return aliasResult;
    }

    return {
      cleanTerm,
      cleanDefinition,
      normalizedTerm,
      aliases: aliasResult.aliases
    };
  }

  root.GlowsaryEntryUtils = Object.freeze({
    collapseSpaces,
    normalizeTerm,
    normalizeAliasList,
    formatAliases,
    normalizeImage,
    parseAliases,
    validateEntry
  });
})(globalThis);
