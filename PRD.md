## Overview

Glowsary is a Chrome extension that adds a personal vocabulary layer over the web. When a user reads English content and looks up a word or phrase, they save it with their own definition. After that, the saved word or phrase is highlighted everywhere it appears on the web, and the saved definition shows up in a small popup when the user hovers or clicks it.

The closest reference is Word Wise on a Kindle. The difference is that the highlights come from the user’s own saved words, not a fixed list, and the definition stays hidden until the user asks for it.

## Problem

People who learn English by reading articles, blogs, and social posts on sites like Medium and Substack have no good way to remember which words they have already looked up. When they meet a word again on a different page, there is no visual sign that they once searched for it. Each new page feels like the first time. This slows learning and wastes the effort already spent looking words up.

## Goals

The product should help a reader recognize words they have already looked up, with as little effort as possible, while they read anywhere on the web.

1. Let the user save a word and a definition quickly while reading.
2. Highlight every saved word across all websites so the user recognizes it on sight.
3. Show the saved definition on demand without leaving the page.
4. Let the user manage their saved words in one place.

## Target user

A self-directed English learner, often a non-native speaker, who reads English content online to improve. They already look up words while reading. They want a low-effort way to keep and recognize those words without changing how they read.

## User stories

1. As a reader, I want to save a word and its meaning while reading, so I do not lose the effort of looking it up.
2. As a reader, I want my saved words highlighted on any page, so I can recognize them again.
3. As a reader, I want to see a saved word’s definition without leaving the page, so my reading is not interrupted.
4. As a reader, I want to turn the highlighting on and off, so I can read normally when I do not want it.
5. As a reader, I want to review, edit, and delete my saved words in one place, so I can keep my list correct and clean.
6. As a reader, I want to add a new word by hand in the management view, so I can save a word even when I am not reading it on a page.

## Functional requirements

### Saving a word or phrase

- FR-1: The user can select a single word or a multi-word phrase on any web page, right-click, and choose an “Add word” action from the context menu.
- FR-2: Choosing the action opens a small in-page UI with three fields: Word, Definition, and Alias. The Word field is pre-filled with the exact text the user selected, including phrases such as “get in”. The Alias field is empty.
- FR-2a: If the selected text already matches a saved entry by its term or by any of its aliases (ignoring capitalization), the UI opens that existing entry with its saved definition and aliases loaded, so the user edits it instead of creating a duplicate.
- FR-3: The user can edit the Word field, type the Definition by hand, and optionally type one or more aliases. The Word and Definition fields are required to save. The Alias field is optional.
- FR-3a: The Word field must contain at least 3 characters after trimming spaces. This blocks very short entries like “a”, “is”, and “at”. The count is measured on the whole field, so a phrase like “get in” (6 characters) is allowed even though “in” alone is short. This also blocks short real words such as “go” and “ID”. The same 3-character minimum applies to each alias after trimming (see FR-3c).
- FR-3b: The Alias field holds zero or more aliases separated by commas. Each alias is an alternate spelling or word form that should be highlighted with the same definition as the term, for example the term “version” with the alias “versions”. On save, the field is split on commas, each alias is trimmed of surrounding spaces, empty results are dropped, and duplicate aliases (ignoring capitalization) are removed. An alias that is identical to the term itself (ignoring capitalization) is also dropped, since the term already matches.
- FR-3c: Each alias must contain at least 3 characters after trimming, using the same rule and reasons as the Word field (FR-3a). If any alias is shorter than 3 characters, the save is blocked and the user is told which alias is too short. As with the term, the count is measured on the whole alias, so a phrase alias such as “get out” is allowed.
- FR-4: The user clicks Save to store the entry locally.
- FR-5: After a successful save, all matching words or phrases on the current page, including matches on aliases, are highlighted immediately, without a page reload.

### Matching and highlighting

- FR-6: Matching is exact text only, for both single words and phrases. Saving “love” matches “love” and does not match “loved”, “loves”, or “loving”. To highlight those forms, the user adds them as aliases.
- FR-6b: An entry’s aliases are matched on the page using the same rules as its term: exact text only (FR-6), contiguous phrase order for multi-word aliases (FR-6a), whole-word edges (FR-7), and case-insensitive (FR-8). A match on an alias is highlighted the same way as a match on the term and reveals the same definition. The skip rules for interactive and navigational elements (FR-9a) apply to alias matches as well.
- FR-6a: A saved phrase is matched only when its words appear together, in the same order, as a contiguous sequence. Saving “get in” matches “get in” but does not match “get” and “in” appearing separately.
- FR-7: Matching is whole-word only at the edges. “love” does not match inside “glove” or “lovely”, and “get in” does not match inside “forget invoices”.
- FR-8: Matching ignores case. Saving “love” highlights “love”, “Love”, and “LOVE”.
- FR-9: A highlighted word or phrase is shown with a Grammarly-style underline. The style must be subtle and must not break or strongly clash with the page’s own design.
- FR-9a: Highlighting must not be applied to text inside interactive or navigational elements. Specifically, text inside `<a>` (hyperlinks), `<button>`, `<nav>`, `<input>`, `<label>`, `<select>`, and `<textarea>` elements must never be highlighted. This rule exists for two reasons: the underline style can be visually confused with a hyperlink, and modifying interactive elements risks breaking their behavior or appearance. If a saved word appears both in a link and in plain body text on the same page, only the plain body text instance is highlighted; the link instance is skipped.
- FR-10: Highlighting watches the page for new content and highlights matching words or phrases as that content appears, so it keeps working on pages that load more text while scrolling or that update without a full reload.
- FR-10a: No text is highlighted twice. When two matches could cover the same text, the longer match wins, whether the match comes from a term or an alias. For example, if both “get it” and “get” are saved, the text “get it” is highlighted as one entry and “get” inside it is not highlighted separately. If two matches are the same length, a term match takes priority over an alias match.
- FR-10b: The same text may be saved as a term in one entry and as an alias in another. This is allowed and not blocked. At highlight time the rules in FR-10a decide which entry wins, so the text is still highlighted only once and its popup shows that entry’s definition.

### Viewing a definition

- FR-11: The user can reveal a saved word’s definition by hovering over a highlighted word or by clicking it.
- FR-12: The definition appears in a small popup placed next to the word. When the highlighted text is an alias, the popup shows the entry’s definition only. It does not show the term or note that the word is an alias. From the reader’s view an alias behaves like any other saved word.
- FR-13: A setting lets the user choose whether hover or click is the trigger. Both behaviors must be built.

### Global on and off

- FR-14: The extension has a single global on/off switch that controls all highlighting.
- FR-15: When the switch is on, saved words are highlighted on every website.
- FR-16: When the switch is off, no highlighting appears on any website. Saving and managing words still work.

### Managing saved words

- FR-17: The extension provides a management view that lists all saved words and phrases with their definitions and their aliases.
- FR-17a: The management view has an “Add new” button that opens the same Word, Definition, and Alias form with empty fields in a centered modal. It uses the same rules as saving from a page: the 3-character minimum on the term and on each alias (FR-3a, FR-3c), the Word and Definition fields required, the Alias field optional, and the case-insensitive duplicate check on term and aliases (FR-2a). If the typed term or alias already exists, the form opens that existing entry for editing instead of creating a copy.
- FR-17b: The management view has a search box that filters the list by term. Matching is case-insensitive and the list updates in real time as the user types. Only the term field is searched, not the definition and not the aliases.
- FR-17c: If the search query matches no entries, the list area shows an empty state message. The search box remains active so the user can clear or change the query.
- FR-17d: The management view has a sort control with two options: “Latest added” (sorted by `createdAt`, newest first) and “A → Z” (alphabetical by term, case-insensitive). The selected sort is persisted and restored when the view is next opened.
- FR-17e: Search and sort work together. When a search query is active, the sort order applies to the filtered results, not the full list.
- FR-18: From the list, the user can edit an entry’s definition and its aliases in the same centered modal used by Add new. Editing replaces the existing definition and replaces the existing alias list with the parsed result of the Alias field (FR-3b, FR-3c). An entry holds only one definition. After an edit, highlighting on open pages reflects the new aliases.
- FR-19: From the list, the user can delete a saved entry. After deletion, that word or phrase is no longer highlighted anywhere.

### Storage

- FR-20: All saved words and settings are stored locally in the browser. There is no account and no cross-device sync.

## UI components

This section names every distinct UI component in the extension. Future references in specs, code, and conversations should use these exact names.

**Highlight underline** — The subtle underline rendered beneath a saved word or phrase on any web page. Styled to be unobtrusive and distinct from hyperlink underlines. Never applied inside interactive or navigational elements.

**Definition popup** — The small floating panel that appears next to a highlighted word when the user hovers or clicks it (depending on the reveal trigger setting). Shows the saved definition for that entry. Dismissed by moving away (hover mode) or clicking elsewhere (click mode).

**Save form** — The in-page UI that appears after the user chooses “Add word” from the context menu. Contains three fields: Word (pre-filled with the selected text), Definition (empty), and Alias (empty, optional). Has a Save button. Opens as an edit form if the selected text matches an existing entry’s term or alias.

**Alias field** — The text input in the save form and management form where the user types optional aliases for the entry, separated by commas. Each alias is an alternate spelling or word form that is highlighted with the same definition as the term.

**Management form modal** — The centered modal opened by Add new and Edit in the management view. Contains Word, Definition, and Alias fields. Closes with the X button, Cancel, or Escape, but not by clicking the backdrop.

**Context menu item** — The “Add word” action injected into the browser’s native right-click context menu when the user has text selected on a page.

**Management view** — The full-page view (extension page or popup panel) that lists all saved entries. Contains the settings bar, the search box, the sort control, the entry list, and the Add new button.

**Settings bar** — The row at the top of the management view that holds the global highlighting toggle and the reveal trigger selector (Hover / Click).

**Global highlighting toggle** — The on/off checkbox or switch inside the settings bar. Controls whether highlights appear on all web pages.

**Reveal trigger selector** — The control inside the settings bar that lets the user choose between Hover and Click as the trigger for showing the definition popup.

**Search box** — The text input in the management view that filters the entry list in real time by term.

**Sort control** — The control in the management view that switches the entry list between “Latest added” and “A → Z” order. The chosen option persists across sessions.

**Entry list** — The scrollable list of saved word entries inside the management view. Each row shows the term, the definition, the aliases (if any), an Edit button, and a Delete button.

**Entry row** — A single item in the entry list. Displays one saved word or phrase, its definition, and its aliases if it has any, with actions to edit or delete.

**Add new button** — The button in the management view that opens the management form modal with empty fields, allowing the user to add a word without selecting it on a page.

**Empty state** — The message shown in the entry list area when no entries match the current search query.

## Core user flow

1. The extension is installed and the global switch is on.
2. The user is reading an article, for example a Substack post.
3. The user meets a word or phrase they do not know and wants to save it.
4. The user selects the word or phrase, right-clicks, and chooses “Add word”.
5. The in-page UI appears with the Word field pre-filled with the selected text. The user types the definition and clicks Save. If the text was already saved, the UI instead opens the existing entry for editing.
6. Every instance of that word or phrase on the current page is highlighted right away.
7. Later, on the same site or any other site, the user hovers or clicks a highlighted instance and sees the saved definition in a popup.
8. The user opens the management view to edit or delete saved entries as needed.

## Data model

Each saved entry holds the word or phrase, the definition, any aliases, and a created timestamp. A suggested shape:

> term: the text to match (word or phrase), stored in a normalized lowercase form for matching displayTerm: the text exactly as the user typed it, shown in the list definition: the user’s typed meaning aliases: a list of alternate forms to match, each stored in a normalized lowercase form, with the user’s original text kept for display createdAt: when the entry was saved

Storing a normalized lowercase form for both the term and each alias supports case-insensitive matching (FR-8) and case-insensitive duplicate detection (FR-2a), while keeping the user’s original text for display in the list. An entry with no aliases stores an empty list.

## Settings

1. Global highlighting switch (on or off).
2. Reveal trigger (hover or click).
