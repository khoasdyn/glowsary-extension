## Overview

Glowsary is a Chrome extension that adds a personal vocabulary layer over the web. When a user reads English content and looks up a word or phrase, they save it with their own definition. After that, the saved word or phrase is highlighted everywhere it appears on the web, and the saved definition shows up in a small popup when the user hovers over it.

The closest reference is Word Wise on a Kindle. The difference is that the highlights come from the user’s own saved words, not a fixed list, and the definition stays hidden until the user asks for it.

This file owns product behavior (the FRs below). The component names this file uses, and their visual specs, live in Figma and are written into each build plan; the design tokens and rules live in DESIGN.md.

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
7. As a reader, I want to export my saved words to a file and import them back, so I can back them up or move them to another device.

## Functional requirements

### Saving a word or phrase

- FR-1: The user can select a single word or a multi-word phrase on any web page, right-click, and choose an “Add word” action from the context menu.
- FR-2: Choosing the action opens a small in-page UI with four fields: Word, Definition, Alias, and Color. The Word field is pre-filled with the exact text the user selected, including phrases such as “get in”. The Alias field is empty and its toggle starts off (FR-3f). The Color field shows the same four-color picker as the management panel, with the first color selected by default (FR-3e, FR-17f).
- FR-2a: Duplicates are allowed. If the selected or typed text matches an existing entry by its term or by any of its aliases, nothing special happens. The user types and saves normally, and a new separate entry is created. There is no duplicate check and no auto-switch into edit mode. The same word can be saved many times, each with its own definition, so one word can hold several meanings. Even a fully identical entry (same word and same definition) can be saved.
- FR-3: The user can edit the Word field, type the Definition by hand, and optionally type one or more aliases after turning on the alias toggle (FR-3f). The Word and Definition fields are required to save. The Alias field is optional.
- FR-3a: The Word field must contain at least 3 characters after trimming spaces. This blocks very short entries like “a”, “is”, and “at”. The count is measured on the whole field, so a phrase like “get in” (6 characters) is allowed even though “in” alone is short. This also blocks short real words such as “go” and “ID”. The same 3-character minimum applies to each alias after trimming (see FR-3c).
- FR-3b: The Alias field holds zero or more aliases separated by commas. Each alias is an alternate spelling or word form that should be highlighted with the same definition as the term, for example the term “version” with the alias “versions”. On save, the field is split on commas, each alias is trimmed of surrounding spaces, empty results are dropped, and duplicate aliases (ignoring capitalization) are removed. An alias that is identical to the term itself (ignoring capitalization) is also dropped, since the term already matches.
- FR-3c: Each alias must contain at least 3 characters after trimming, using the same rule and reasons as the Word field (FR-3a). If any alias is shorter than 3 characters, the save is blocked and the user is told which alias is too short. As with the term, the count is measured on the whole alias, so a phrase alias such as “get out” is allowed.
- FR-3d: The Word field is capped at 50 characters and the Definition field at 350 characters. These are hard limits: input stops at the cap, so the user cannot type or paste past 50 characters in Word or past 350 in Definition. The 3-character minimum (FR-3a) still applies, so the Word field accepts 3 to 50 characters. The Alias field has no maximum length; only the per-alias 3-character minimum applies (FR-3c).
- FR-3e: Every saved entry has one color, taken from a fixed set of four colors. The color tints three places: the entry’s card in the management list (see FR-17g), the Definition Popup, and the on-page highlight underline (FR-9). The color is chosen in both places that create or change an entry: the in-page save form (FR-2) and the Management form panel (FR-17f). In both, one color is always selected, and new entries start with the first color by default.
- FR-3f: The Alias field sits behind a toggle, in both places that create or change an entry: the in-page save form (FR-2) and the Management form panel (FR-17f). The “Aliases” label, the toggle, and a short hint are always visible; only the input field shows or hides. When the toggle is off, the input is hidden; when on, the input is shown. The hint text reads “Aliases are other spellings or forms of this word, like "versions" for "version". They get the same highlight and definition. Separate each with a comma.” and the input placeholder reads “Other spellings, separated by commas”. The toggle starts off when adding a new word, including from the in-page save form, so the field starts empty. When editing a word that already has aliases, the toggle starts on so its aliases show; editing a word with no aliases starts off. Turning the toggle on reveals the input but does not move the cursor into it; turning it off only hides the input, with no warning. On save, the toggle decides whether aliases are kept: if it is off, the entry is saved with no aliases, even if aliases were typed or already existed, and any existing aliases are removed with no warning (a deliberate exception that lets editing clear all aliases). If it is on, the aliases are parsed, cleaned, and validated as in FR-3b and FR-3c. The per-alias 3-character minimum (FR-3c) is checked only when the toggle is on; when it is off there is nothing to validate. All other alias behavior (optional, comma-separated, matching rules) is unchanged.
- FR-4: The user clicks Save to store the entry locally.
- FR-5: After a successful save, all matching words or phrases on the current page, including matches on aliases, are highlighted immediately, without a page reload.

### Matching and highlighting

- FR-6: Matching is exact text only, for both single words and phrases. Saving “love” matches “love” and does not match “loved”, “loves”, or “loving”. To highlight those forms, the user adds them as aliases.
- FR-6b: An entry’s aliases are matched on the page using the same rules as its term: exact text only (FR-6), contiguous phrase order for multi-word aliases (FR-6a), whole-word edges (FR-7), and case-insensitive (FR-8). A match on an alias is highlighted the same way as a match on the term and reveals the same definition. The skip rules for interactive and navigational elements (FR-9a) apply to alias matches as well.
- FR-6a: A saved phrase is matched only when its words appear together, in the same order, as a contiguous sequence. Saving “get in” matches “get in” but does not match “get” and “in” appearing separately.
- FR-7: Matching is whole-word only at the edges. “love” does not match inside “glove” or “lovely”, and “get in” does not match inside “forget invoices”.
- FR-8: Matching ignores case. Saving “love” highlights “love”, “Love”, and “LOVE”.
- FR-9: A highlighted word or phrase is shown with a subtle dashed underline in the entry’s card color. The underline uses a medium shade of that color normally and a darker shade on hover. The style must stay subtle, must not break or strongly clash with the page’s own design, and must stay distinct from a hyperlink underline. When one underline stands for several entries (FR-10b), it takes the newest entry’s color.
- FR-9a: Highlighting must not be applied to text inside interactive or navigational elements. Specifically, text inside `<a>` (hyperlinks), `<button>`, `<nav>`, `<input>`, `<label>`, `<select>`, and `<textarea>` elements must never be highlighted. This rule exists for two reasons: the underline style can be visually confused with a hyperlink, and modifying interactive elements risks breaking their behavior or appearance. If a saved word appears both in a link and in plain body text on the same page, only the plain body text instance is highlighted; the link instance is skipped.
- FR-10: Highlighting watches the page for new content and highlights matching words or phrases as that content appears, so it keeps working on pages that load more text while scrolling or that update without a full reload.
- FR-10a: No piece of text is highlighted twice. When two matches of different length could cover the same text, the longer match wins, whether it comes from a term or an alias. For example, if both “get it” and “get” are saved, the text “get it” is highlighted as one match and “get” inside it is not highlighted separately. When several entries match the exact same text, that text is highlighted once as a single underline, and all of those entries are shown together in the definition popup as separate pages (see FR-11a and FR-10b).
- FR-10b: The same exact text may come from several entries at once: from the terms of different entries, from a term in one entry and an alias in another, or any mix. All entries that match the exact highlighted text (ignoring case) are grouped and shown as pages in one popup. There is no single winner for the popup. The shared underline on the page takes the color of the newest matching entry, which is the first page shown in the popup (FR-11a), so the underline color and the first popup page always match. Grouping is by exact text only and does not apply to different-length overlaps, which still follow FR-10a.

### Viewing a definition

- FR-11: The user can reveal a saved word’s definition by hovering over a highlighted word. Hover is the only reveal trigger.
- FR-11a: When the highlighted text matches more than one entry (FR-10b), the popup shows one definition at a time with pagination controls at the bottom of the card to move between the matching entries. Definitions are ordered newest first, so the most recently added entry is the first page. When only one entry matches, no pagination controls are shown.
- FR-12: The definition appears in a small popup placed next to the word. When the highlighted text is an alias, the popup shows the entry’s definition only. It does not show the term or note that the word is an alias. From the reader’s view an alias behaves like any other saved word.
- FR-13: The definition popup must be sticky so pagination works. When the pointer moves from the highlighted word onto the popup, the popup stays open and its pagination controls stay clickable. It closes only when the pointer leaves both the word and the popup. This stops the popup from closing while the user reaches for a pagination control.

### Global on and off

- FR-14: The extension has a single global on/off switch that controls all highlighting. This switch lives only in the toolbar popup (FR-22). The management view has no copy of it.
- FR-15: When the switch is on, saved words are highlighted on every website that is not on the excluded sites list (see FR-26).
- FR-16: When the switch is off, no highlighting appears on any website. Saving and managing words still work.

### Excluded sites

- FR-26: The user can keep a list of excluded sites. On an excluded site, highlighting is suppressed: no highlight underline and no definition popup appear, even when the global switch is on. Every other feature still works on that site, including the right-click “Add word” action, saving entries, and the management view. Saving a word on an excluded site succeeds but shows no highlight there, which overrides FR-5 for that site. Exclusion only hides the visual highlighting layer.
- FR-27: A site is identified by a domain, and excluding a domain also covers all of its subdomains. Excluding “spotify.com” covers “open.spotify.com” and “accounts.spotify.com”. The user never lists subdomains separately.
- FR-27a: Every excluded entry is stored as the whole-site domain, and the whole-site reduction handles multi-part domain endings correctly using a known public suffix list. So “open.spotify.com” reduces to “spotify.com”, “spotify.co.uk” reduces to “spotify.co.uk” and not “co.uk”, and “myname.github.io” stays “myname.github.io” and not all of “github.io”. The same reduction applies to every way a site is added, so the list never holds bare subdomains.
- FR-28: The Settings tab of the management view has an “Add New” button that opens the Add Site dialog (FR-28a). This is the only way to add an excluded site. There is no longer a one-click “exclude the current site” action anywhere, including the toolbar popup. The management view is the only place to delete an excluded site (FR-30).
- FR-28a: The Add Site dialog has a single “Site” field where the user types a site to exclude. The user can type either a full URL (for example “https://open.spotify.com/playlist”) or a bare domain (for example “spotify.com”). On save, the typed value is reduced to its whole-site domain (FR-27a) and added to the list. When the dialog first opens, the field is empty and shows a placeholder, with no error message; the Save button is disabled. The inline “Please enter valid URL” message appears only after the user has typed a value that is not a valid URL or domain. While the field is empty, no error is shown. The Save button stays disabled while the value is empty or not valid, and enables once the value is a valid URL or domain. The dialog has only this one field, a title, an X close, and the Save button. There is no color, alias, or any other field, and there is no edit mode, since an excluded site has nothing to edit (FR-30). The dialog is closed by the X.
- FR-29a: Saving a duplicate does nothing. If the cleaned whole-site domain (FR-27a) is already on the list, pressing Save adds no second entry and shows no error: the dialog closes as a normal save and the list is unchanged. Because every entry is reduced to a whole-site domain (FR-27a), two entries can never overlap by subdomain, so a duplicate is always an exact match.
- FR-30: The excluded sites manager shows the list of excluded sites and the “Add New” button (FR-28). Every site in the list is always active: highlighting is always suppressed on each listed site whenever the global switch is on. There is no master on/off switch and no per-site toggle. The only way to stop excluding a site is to delete it from the list. Each entry has only a delete button. There is no edit.
- FR-32: Adding or deleting an excluded site applies live to all open tabs with no reload, the same way the global switch does (FR-23). Adding a site clears its highlights on all of its open tabs at once, and deleting a site restores highlights there.
- FR-33: The excluded sites list is stored locally with the rest of the data (FR-20). There is no account and no cross-device sync.

### Toolbar popup

- FR-21: Clicking the Glowsary icon in the browser toolbar opens the toolbar popup, a small panel. It does not open the management view directly anymore.
- FR-22: The toolbar popup contains the global highlighting switch and a “Go To App” button. This switch is the single global on/off (FR-14) and is the only place to turn highlighting on or off. The management view no longer has its own copy of the switch.
- FR-23: Changing the global switch in the popup applies live to all open pages running the extension, with no reload. Turning highlighting off clears all highlights on every open page at once (FR-16), and turning it on restores them (FR-15).
- FR-24: The "Go To App" button in the popup opens the management view as a full page in a new browser tab, and the popup closes. If a management view tab is already open, that existing tab is focused instead of opening a new one, so duplicate tabs do not pile up.
- FR-25: The toolbar icon reflects the current global highlighting state. When highlighting is on, the icon shows its normal colored form with no badge. When highlighting is off, the icon switches to a grayscale form and a small "OFF" badge is shown at the same time, so the user can tell the on or off state at a glance without opening the popup.

### Management view layout

- FR-38: The management view is split into two tabs, Home and Settings, under a shared header. The shared header shows a single centered title, "Welcome to Glowsary!", with no subtitle, and stays visible on both tabs. A tab nav sits directly below the centered title and switches between Home and Settings.
- FR-39: The Home tab holds everything for managing saved words. At the top is a section heading that shows the word count as "Saved Words (N)". There is no switch on this heading. Below the heading is a subtitle line that reads "Your saved words are highlighted across every site you visit". Below the subtitle sit the search box and sort control. Below those is the word card grid, which shows all saved word cards and always has the "Add New Word" card as its first item.
- FR-40: The Settings tab holds the excluded sites manager and the Backup Data section. The excluded sites manager has its section heading "Excluded Sites (N)", a subtitle line, an "Add New" button that opens the Add Site dialog (FR-28), and the excluded sites list. There is no master on/off switch on the heading. Deletion is the only action on items in the list. The Backup Data section has the Import button and the Export button.
- FR-41: The management view always opens on the Home tab.
- FR-42: The word card grid uses four columns. Each card has a fixed height. When the definition text is too long to fit in the card, it is truncated with an ellipsis. The full definition is only visible inside the Management form panel.
- FR-43: Each word card shows three pieces of content: the term at the top, the definition below it, and any aliases as small pills at the bottom. If an entry has no aliases, the alias area is empty. Switching between tabs does not reload the page and does not change or lose any saved word, excluded site, search text, or sort choice. It only changes which tab is shown.

### Managing saved words

- FR-17: The extension provides a management view that displays all saved words and phrases with their definitions and aliases in a grid of cards.
- FR-17a: The management view has an “Add New Word” card that is always the first item in the grid, regardless of search or sort state. Clicking it opens the Management form panel with empty fields. The panel slides in from the right edge, is full height, and keeps a 16px margin on all edges, opening over the management view. It uses the same rules as saving from a page: the 3-character minimum on the term and on each alias (FR-3a, FR-3c), the Word and Definition fields required, and the Alias field optional. In add mode the footer shows only a Save button and no delete button. There is no duplicate check (FR-2a). Typing a word that already exists creates a new separate entry on save; the form never switches into edit mode.
- FR-17b: The management view has a search box that filters the list by term. Matching is case-insensitive and the list updates in real time as the user types. Only the term field is searched, not the definition and not the aliases.
- FR-17c: If the search query matches no entries, the grid shows the "Add New Word" card and an empty state message in place of any word cards. The search box remains active so the user can clear or change the query.
- FR-17d: The management view has a sort control with two options: “Latest added” (sorted by `createdAt`, newest first) and “A → Z” (alphabetical by term, case-insensitive). The selected sort is persisted and restored when the view is next opened.
- FR-17e: Search and sort work together. When a search query is active, the sort order applies to the filtered results, not the full list.
- FR-17f: The Management form panel has a Color field below the Aliases field, holding a color picker of the four fixed colors. Exactly one color is always selected and cannot be cleared to none. In add mode the first color is selected by default; in edit mode the entry’s saved color is selected. The user changes the color by tapping another color, which moves the selection.
- FR-17g: The chosen color is the full background color of the word card. Each of the four fixed colors maps to a distinct pastel background that covers the entire card surface.
- FR-18: By clicking a word card in the grid, the user can edit an entry’s definition, its aliases, and its color in the same right-side panel (the Management form panel) used by Add New Word. Editing replaces the existing definition and replaces the existing alias list with the parsed result of the Alias field (FR-3b, FR-3c). The alias toggle (FR-3f) starts on when the entry has aliases; saving with the toggle off removes all of the entry’s aliases. An entry holds only one definition. After an edit, highlighting on open pages reflects the new aliases.
- FR-18a: In edit mode the panel footer shows a Save button and a delete button beside it. The delete button removes the entry at once: there is no confirmation step and no undo. This is the same delete result as deleting from the list (FR-19), now also reachable from inside the edit panel. Add mode has no delete button. Note: the user accepted the accidental-loss risk of immediate delete with no confirm and no undo (decision 2026-06-08).
- FR-19: The user can delete a saved entry from inside the Management form panel in edit mode (FR-18a). There is no delete action on the word card itself. After deletion, that word or phrase is no longer highlighted anywhere.

### Storage

- FR-20: All saved words, the excluded sites list, and settings are stored locally in the browser. There is no account and no cross-device sync.

### Import and export

- FR-34: The management view has an Export button that saves all saved words to a CSV file. Export always includes the full list and ignores any active search filter (FR-17b), so a backup is never partial.
- FR-35: The export file is a CSV with no header row and four columns by position: term, definition, aliases, and color. The term and definition use the user's original text as shown in the list. The aliases column holds the entry's aliases in their display form, separated by commas; an entry with no aliases has an empty aliases cell. The color column holds the entry's color as a stable name or value that import can read back; every entry has a color, so this cell is never empty. The created timestamp is not exported. The file is encoded as UTF-8.
- FR-35a: Commas, quotes, and line breaks inside any field are handled with standard CSV quoting, so a comma inside a definition or inside the alias list does not break a row.
- FR-36: The management view has an Import button that lets the user pick a CSV file and add its words to the saved list. Each row is read by position using the same four columns as export (FR-35). No header row is expected, so every row is treated as data. To stay compatible with older backups, a row with only the first three columns (no color) still imports, and that entry gets the first color by default. A color value that is missing or not one of the four fixed colors also falls back to the first color.
- FR-36a: Each imported row goes through the same save rules as adding a word by hand (FR-3, FR-3a, FR-3b, FR-3c): the term and definition are required, the term and each alias must be at least 3 characters after trimming, and the alias field is split on commas, trimmed, de-duplicated, and cleaned.
- FR-36b: Import skips exact duplicates. A row is an exact duplicate when its term, its definition, and its full set of aliases all match an existing entry, compared in normalized lowercase form, with alias order ignored. Color is not part of this comparison, so a row that matches an existing entry on term, definition, and aliases but has a different color still counts as a duplicate and is skipped; the existing entry's color is kept and is not changed by the import. This is a deliberate exception to FR-2a that applies only to import, so re-importing a backup does not double the list. Duplicate rows within the same file are collapsed the same way.
- FR-36c: Invalid rows are skipped, not fatal. A row missing a term or definition, with a term or alias under 3 characters, or otherwise malformed is dropped, and all valid rows still import. A file that cannot be read as CSV at all is rejected and nothing is imported.
- FR-36d: After an import finishes, a toast message summarizes the result: how many entries were added, how many were skipped as duplicates, and how many were skipped as invalid. A file that cannot be read shows a short error toast instead.
- FR-36e: Imported entries get the import time as their created timestamp, so the restored list orders by import time under the "Latest added" sort (FR-17d). An empty file, or a file with no valid rows, imports nothing and the toast reports that.
- FR-37: Import and export cover saved words only. The excluded sites list and the settings are not exported or imported.

## Core user flow

1. The extension is installed and the global switch is on.
2. The user is reading an article, for example a Substack post.
3. The user meets a word or phrase they do not know and wants to save it.
4. The user selects the word or phrase, right-clicks, and chooses “Add word”.
5. The in-page UI appears with the Word field pre-filled with the selected text. The user types the definition and clicks Save. If the text was already saved before, this still creates a new separate entry; there is no duplicate block.
6. Every instance of that word or phrase on the current page is highlighted right away.
7. Later, on the same site or any other site, the user hovers over a highlighted instance and sees the saved definition in a popup. If the word has more than one saved entry, the popup pages through them, newest first.
8. To change settings or manage words, the user clicks the toolbar icon to open the toolbar popup. From there they can toggle highlighting on or off, or click "Go To App" to open the management view in a new tab. From the management view they can edit or delete saved entries and manage the excluded sites list, including adding the current site to the excluded list from the Settings tab.

## Data model

Each saved entry holds the word or phrase, the definition, any aliases, a color, and a created timestamp. A suggested shape:

> term: the text to match (word or phrase), stored in a normalized lowercase form for matching displayTerm: the text exactly as the user typed it, shown in the list definition: the user’s typed meaning aliases: a list of alternate forms to match, each stored in a normalized lowercase form, with the user’s original text kept for display color: one of the four fixed colors, defaulting to the first color when none is chosen createdAt: when the entry was saved

Storing a normalized lowercase form for both the term and each alias supports case-insensitive matching (FR-8) and case-insensitive grouping of entries that share the same text in the popup (FR-10b), while keeping the user’s original text for display in the list. An entry with no aliases stores an empty list.

Each excluded site holds the whole-site domain (FR-27a), stored in a normalized lowercase form so site matching ignores case. A suggested shape: domain (the normalized whole-site domain to match), and a created timestamp for ordering the list. Every listed site is always active (FR-30); there is no master switch and no per-site active field.

## Settings

1. Global highlighting switch (on or off). Lives only in the toolbar popup (FR-22).
2. Excluded sites list (the set of domains where highlighting is suppressed when the global switch is on). Every listed site is always active; there is no master switch (FR-30).
