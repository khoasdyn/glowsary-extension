## Overview

Glowsary is a Chrome extension that adds a personal vocabulary layer over the web. When a user reads English content and looks up a word or phrase, they save it with their own definition. After that, the saved word or phrase is highlighted everywhere it appears on the web, and the saved definition shows up in a small popup when the user hovers over it.

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
7. As a reader, I want to export my saved words to a file and import them back, so I can back them up or move them to another device.

## Functional requirements

### Saving a word or phrase

- FR-1: The user can select a single word or a multi-word phrase on any web page, right-click, and choose an “Add word” action from the context menu.
- FR-2: Choosing the action opens a small in-page UI with three fields: Word, Definition, and Alias. The Word field is pre-filled with the exact text the user selected, including phrases such as “get in”. The Alias field is empty.
- FR-2a: Duplicates are allowed. If the selected or typed text matches an existing entry by its term or by any of its aliases, nothing special happens. The user types and saves normally, and a new separate entry is created. There is no duplicate check and no auto-switch into edit mode. The same word can be saved many times, each with its own definition, so one word can hold several meanings. Even a fully identical entry (same word and same definition) can be saved.
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
- FR-10a: No piece of text is highlighted twice. When two matches of different length could cover the same text, the longer match wins, whether it comes from a term or an alias. For example, if both “get it” and “get” are saved, the text “get it” is highlighted as one match and “get” inside it is not highlighted separately. When several entries match the exact same text, that text is highlighted once as a single underline, and all of those entries are shown together in the definition popup as separate pages (see FR-11a and FR-10b).
- FR-10b: The same exact text may come from several entries at once: from the terms of different entries, from a term in one entry and an alias in another, or any mix. All entries that match the exact highlighted text (ignoring case) are grouped and shown as pages in one popup. There is no single winner. Grouping is by exact text only and does not apply to different-length overlaps, which still follow FR-10a.

### Viewing a definition

- FR-11: The user can reveal a saved word’s definition by hovering over a highlighted word. Hover is the only reveal trigger.
- FR-11a: When the highlighted text matches more than one entry (FR-10b), the popup shows one definition at a time with pagination controls at the bottom of the card to move between the matching entries. Definitions are ordered newest first, so the most recently added entry is the first page. When only one entry matches, no pagination controls are shown.
- FR-12: The definition appears in a small popup placed next to the word. When the highlighted text is an alias, the popup shows the entry’s definition only. It does not show the term or note that the word is an alias. From the reader’s view an alias behaves like any other saved word.
- FR-13: The definition popup must be sticky so pagination works. When the pointer moves from the highlighted word onto the popup, the popup stays open and its pagination controls stay clickable. It closes only when the pointer leaves both the word and the popup. This stops the popup from closing while the user reaches for a pagination control.

### Global on and off

- FR-14: The extension has a single global on/off switch that controls all highlighting.
- FR-15: When the switch is on, saved words are highlighted on every website that is not on the excluded sites list (see FR-26).
- FR-16: When the switch is off, no highlighting appears on any website. Saving and managing words still work.

### Excluded sites

- FR-26: The user can keep a list of excluded sites. On an excluded site, highlighting is suppressed: no highlight underline and no definition popup appear, even when the global switch is on. Every other feature still works on that site, including the right-click “Add word” action, saving entries, and the management view. Saving a word on an excluded site succeeds but shows no highlight there, which overrides FR-5 for that site. Exclusion only hides the visual highlighting layer.
- FR-27: A site is identified by a domain, and excluding a domain also covers all of its subdomains. Excluding “spotify.com” covers “open.spotify.com” and “accounts.spotify.com”. The user never lists subdomains separately.
- FR-27a: Every excluded entry is stored as the whole-site domain, and the whole-site reduction handles multi-part domain endings correctly using a known public suffix list. So “open.spotify.com” reduces to “spotify.com”, “spotify.co.uk” reduces to “spotify.co.uk” and not “co.uk”, and “myname.github.io” stays “myname.github.io” and not all of “github.io”. The same reduction applies to every way a site is added, so the list never holds bare subdomains.
- FR-28: The toolbar popup has an “Exclude this site” button that adds the current tab’s whole site (FR-27a) to the excluded list in one click. The button only adds. It does not toggle or delete. If the current site is already on the excluded list, the click is blocked with a short note that the site is already on the list (FR-29a). The management view is the only place to edit or delete an excluded site (FR-30, FR-31).
- FR-29: The management view provides an input to type a domain and exclude a site the user is not currently visiting. The input cleans messy text before saving, so forms like “https://www.spotify.com/playlist” or “SPOTIFY.com” are reduced to the whole-site domain “spotify.com” (FR-27a). The add succeeds only when the cleaned result is a valid domain.
- FR-29a: Redundant adds are blocked. If the cleaned domain is already on the list, the add is rejected with a short note that the site is already on the list. This applies to the one-click button (FR-28), the manual add (FR-29), and inline edit (FR-31). Because every entry is reduced to a whole-site domain (FR-27a), two entries can never overlap by subdomain, so a duplicate is always an exact match.
- FR-30: The excluded sites manager has a single master on/off switch at the top that controls all excluded sites at once. When the master switch is off, exclusion is paused for the entire list: every site in the list allows highlighting again, but the list is preserved. When the master switch is on, all listed sites are active and highlighting is suppressed on them. Each entry has only a delete button. There is no per-site toggle and no separate edit button.
- FR-31: The domain text of an excluded entry is edited inline in the list. The user types freely with no validation or error while typing. Validation runs only when the user commits the edit by pressing Enter or moving focus away from the field. On commit, the input is cleaned (FR-29) and checked for redundancy (FR-29a). If the result is not a valid domain or duplicates another entry, the change is rejected and the field reverts to its previous value.
- FR-32: Adding or deleting an excluded site, or toggling the master switch, applies live to all open tabs with no reload, the same way the global switch does (FR-23). Excluding a site clears its highlights on all of its open tabs at once, and removing a site or turning the master switch off restores highlights there.
- FR-33: The excluded sites list is stored locally with the rest of the data (FR-20). There is no account and no cross-device sync.

### Toolbar popup

- FR-21: Clicking the Glowsary icon in the browser toolbar opens the toolbar popup, a small panel. It does not open the management view directly anymore.
- FR-22: The toolbar popup contains the global highlighting switch and a settings button. The switch is the same global on/off as FR-14 and shares one state with the global highlighting switch in the highlighting bar, so changing it in either place updates the other. The popup also has an “Exclude this site” button that adds the current site to the excluded list in one click (FR-28).
- FR-23: Changing the global switch in the popup applies live to all open pages running the extension, with no reload. Turning highlighting off clears all highlights on every open page at once (FR-16), and turning it on restores them (FR-15).
- FR-24: The settings button in the popup opens the management view as a full page in a new browser tab, and the popup closes. If a management view tab is already open, that existing tab is focused instead of opening a new one, so duplicate tabs do not pile up.
- FR-25: The toolbar icon reflects the current global highlighting state. When highlighting is on, the icon shows its normal colored form with no badge. When highlighting is off, the icon switches to a grayscale form and a small "OFF" badge is shown at the same time, so the user can tell the on or off state at a glance without opening the popup.

### Management view layout

- FR-38: The management view is split into two tabs, Home and Settings, under a shared header. The shared header holds the Glowsary page title and its subtitle and stays visible on both tabs. A tab nav sits directly below the header and switches between Home and Settings.
- FR-39: The Home tab holds everything for managing saved words: the global highlighting switch (the highlighting bar), the Add new button, and the saved words area, which is the entry count, the Export button, the Import button, the search box, the sort control, and the entry list.
- FR-40: The Settings tab holds the excluded sites manager only: the master on/off switch, the add excluded site input, and the excluded sites list.
- FR-41: The management view always opens on the Home tab. Switching between tabs does not reload the page and does not change or lose any saved word, excluded site, search text, or sort choice. It only changes which tab is shown.

### Managing saved words

- FR-17: The extension provides a management view that lists all saved words and phrases with their definitions and their aliases.
- FR-17a: The management view has an “Add new” button that opens the same Word, Definition, and Alias form with empty fields in a centered modal. It uses the same rules as saving from a page: the 3-character minimum on the term and on each alias (FR-3a, FR-3c), the Word and Definition fields required, and the Alias field optional. There is no duplicate check (FR-2a). Typing a word that already exists creates a new separate entry on save; the form never switches into edit mode.
- FR-17b: The management view has a search box that filters the list by term. Matching is case-insensitive and the list updates in real time as the user types. Only the term field is searched, not the definition and not the aliases.
- FR-17c: If the search query matches no entries, the list area shows an empty state message. The search box remains active so the user can clear or change the query.
- FR-17d: The management view has a sort control with two options: “Latest added” (sorted by `createdAt`, newest first) and “A → Z” (alphabetical by term, case-insensitive). The selected sort is persisted and restored when the view is next opened.
- FR-17e: Search and sort work together. When a search query is active, the sort order applies to the filtered results, not the full list.
- FR-18: From the list, the user can edit an entry’s definition and its aliases in the same centered modal used by Add new. Editing replaces the existing definition and replaces the existing alias list with the parsed result of the Alias field (FR-3b, FR-3c). An entry holds only one definition. After an edit, highlighting on open pages reflects the new aliases.
- FR-19: From the list, the user can delete a saved entry. After deletion, that word or phrase is no longer highlighted anywhere.

### Storage

- FR-20: All saved words, the excluded sites list, and settings are stored locally in the browser. There is no account and no cross-device sync.

### Import and export

- FR-34: The management view has an Export button that saves all saved words to a CSV file. Export always includes the full list and ignores any active search filter (FR-17b), so a backup is never partial.
- FR-35: The export file is a CSV with no header row and three columns by position: term, definition, and aliases. The term and definition use the user's original text as shown in the list. The aliases column holds the entry's aliases in their display form, separated by commas; an entry with no aliases has an empty aliases cell. The created timestamp is not exported. The file is encoded as UTF-8.
- FR-35a: Commas, quotes, and line breaks inside any field are handled with standard CSV quoting, so a comma inside a definition or inside the alias list does not break a row.
- FR-36: The management view has an Import button that lets the user pick a CSV file and add its words to the saved list. Each row is read by position using the same three columns as export (FR-35). No header row is expected, so every row is treated as data.
- FR-36a: Each imported row goes through the same save rules as adding a word by hand (FR-3, FR-3a, FR-3b, FR-3c): the term and definition are required, the term and each alias must be at least 3 characters after trimming, and the alias field is split on commas, trimmed, de-duplicated, and cleaned.
- FR-36b: Import skips exact duplicates. A row is an exact duplicate when its term, its definition, and its full set of aliases all match an existing entry, compared in normalized lowercase form, with alias order ignored. This is a deliberate exception to FR-2a that applies only to import, so re-importing a backup does not double the list. Duplicate rows within the same file are collapsed the same way.
- FR-36c: Invalid rows are skipped, not fatal. A row missing a term or definition, with a term or alias under 3 characters, or otherwise malformed is dropped, and all valid rows still import. A file that cannot be read as CSV at all is rejected and nothing is imported.
- FR-36d: After an import finishes, a toast message summarizes the result: how many entries were added, how many were skipped as duplicates, and how many were skipped as invalid. A file that cannot be read shows a short error toast instead.
- FR-36e: Imported entries get the import time as their created timestamp, so the restored list orders by import time under the "Latest added" sort (FR-17d). An empty file, or a file with no valid rows, imports nothing and the toast reports that.
- FR-37: Import and export cover saved words only. The excluded sites list and the settings are not exported or imported.

## UI components

This section names every distinct UI component in the extension. Future references in specs, code, and conversations should use these exact names.

**Highlight underline** — The subtle underline rendered beneath a saved word or phrase on any web page. Styled to be unobtrusive and distinct from hyperlink underlines. Never applied inside interactive or navigational elements.

**Definition popup** — The small floating panel that appears next to a highlighted word when the user hovers over it. Shows the saved definition for that entry. When several entries match the same text, it pages through them one at a time, newest first, using the definition pagination control. It is sticky: it stays open while the pointer is on the popup so the controls remain usable. Dismissed by moving the pointer away from both the word and the popup.

**Definition pagination control** — The controls at the bottom of the definition popup that move between the entries matching the same highlighted text. Only shown when more than one entry matches.

**Save form** — The in-page UI that appears after the user chooses “Add word” from the context menu. Contains three fields: Word (pre-filled with the selected text), Definition (empty), and Alias (empty, optional). Has a Save button. Always opens as a new-entry form; matching an existing word does not change its behavior and creates a separate entry on save.

**Alias field** — The text input in the save form and management form where the user types optional aliases for the entry, separated by commas. Each alias is an alternate spelling or word form that is highlighted with the same definition as the term.

**Management form modal** — The centered modal opened by Add new and Edit in the management view. Contains Word, Definition, and Alias fields. Closes with the X button, Cancel, or Escape, but not by clicking the backdrop.

**Context menu item** — The “Add word” action injected into the browser’s native right-click context menu when the user has text selected on a page.

**Toolbar popup** — The small panel that opens when the user clicks the Glowsary icon in the browser toolbar. Contains the global highlighting switch, the “Exclude this site” button, and the settings button. It is the entry point for the icon; it replaces opening the management view directly.

**Exclude this site button** — The button inside the toolbar popup that adds the current tab’s whole site to the excluded sites list in one click. It only adds; it does not pause, edit, or delete. When the current site is already excluded, the add is blocked with a short note.

**Settings button** — The button inside the toolbar popup that opens the management view as a full page in a new browser tab and closes the popup. If a management view tab is already open, it focuses that tab instead of opening a new one.

**Toolbar icon** — The Glowsary icon in the browser toolbar. Clicking it opens the toolbar popup. Its appearance reflects the global highlighting state: the normal colored icon with no badge when highlighting is on, and a grayscale icon shown together with a small "OFF" badge when highlighting is off.

**Management view** — The full-page view, opened in a browser tab from the toolbar popup's settings button. It has a shared header with the Glowsary title and subtitle, and a tab nav below it that splits the view into two tabs, the Home tab and the Settings tab. It opens on the Home tab. It still contains all the same parts as before, now divided across the two tabs: the saved words tools on the Home tab and the excluded sites manager on the Settings tab (FR-38, FR-39, FR-40).

**Tab nav** — The navigation control below the shared header of the management view that switches between the Home tab and the Settings tab.

**Home tab** — The default tab of the management view. Holds the tools for managing saved words: the highlighting bar with the global highlighting switch, the Add new button, and the saved words area (the entry count, the Export button, the Import button, the search box, the sort control, and the entry list).

**Settings tab** — The tab of the management view that holds the excluded sites manager only: the master on/off switch, the add excluded site input, and the excluded sites list.

**Shared header** — The top area of the management view, above the tab nav, that shows the Glowsary title and subtitle and stays visible on both the Home tab and the Settings tab.

**Excluded sites manager** — The area of the management view that controls the excluded sites list. Contains the master on/off switch that pauses or resumes all exclusions at once, the add excluded site input, and the excluded sites list. It is the only place to add by typing, edit, or delete excluded sites.

**Add excluded site input** — The text input in the excluded sites manager where the user types a domain to exclude. Cleans messy input down to the whole-site domain on add and blocks redundant entries.

**Excluded sites list** — The list of excluded sites inside the excluded sites manager. Each row is an excluded site row.

**Excluded site row** — A single item in the excluded sites list. Shows one excluded domain as an inline-editable field, with a delete button. It has no per-site toggle, no separate edit button; the domain is edited inline.

**Highlighting bar** — The row at the top of the Home tab that holds the global highlighting switch. This was called the settings bar before the two-tab layout; it was renamed to avoid confusion with the Settings tab.

**Global highlighting switch** — The on/off switch inside the highlighting bar and the toolbar popup. Controls whether highlights appear on all web pages. The same state is shared between both locations.

**Search box** — The text input in the management view that filters the entry list in real time by term.

**Sort control** — The control in the management view that switches the entry list between “Latest added” and “A → Z” order. The chosen option persists across sessions.

**Entry list** — The scrollable list of saved word entries inside the management view. Each row shows the term, the definition, the aliases (if any), an Edit button, and a Delete button.

**Entry row** — A single item in the entry list. Displays one saved word or phrase, its definition, and its aliases if it has any, with actions to edit or delete.

**Add new button** — The button in the management view that opens the management form modal with empty fields, allowing the user to add a word without selecting it on a page.

**Export button** — The button in the management view that saves all saved words to a CSV file. It always exports the full list, ignoring any active search filter.

**Import button** — The button in the management view that lets the user pick a CSV file and add its words to the saved list, skipping exact duplicates and invalid rows.

**Empty state** — The message shown in the entry list area when no entries match the current search query.

## Core user flow

1. The extension is installed and the global switch is on.
2. The user is reading an article, for example a Substack post.
3. The user meets a word or phrase they do not know and wants to save it.
4. The user selects the word or phrase, right-clicks, and chooses “Add word”.
5. The in-page UI appears with the Word field pre-filled with the selected text. The user types the definition and clicks Save. If the text was already saved before, this still creates a new separate entry; there is no duplicate block.
6. Every instance of that word or phrase on the current page is highlighted right away.
7. Later, on the same site or any other site, the user hovers over a highlighted instance and sees the saved definition in a popup. If the word has more than one saved entry, the popup pages through them, newest first.
8. To change settings or manage words, the user clicks the toolbar icon to open the toolbar popup. From there they can toggle highlighting on or off, exclude the current site in one click, or click the settings button to open the management view in a new tab to edit or delete saved entries and manage the excluded sites list.

## Data model

Each saved entry holds the word or phrase, the definition, any aliases, and a created timestamp. A suggested shape:

> term: the text to match (word or phrase), stored in a normalized lowercase form for matching displayTerm: the text exactly as the user typed it, shown in the list definition: the user’s typed meaning aliases: a list of alternate forms to match, each stored in a normalized lowercase form, with the user’s original text kept for display createdAt: when the entry was saved

Storing a normalized lowercase form for both the term and each alias supports case-insensitive matching (FR-8) and case-insensitive grouping of entries that share the same text in the popup (FR-10b), while keeping the user’s original text for display in the list. An entry with no aliases stores an empty list.

Each excluded site holds the whole-site domain (FR-27a), stored in a normalized lowercase form so site matching ignores case. A suggested shape: domain (the normalized whole-site domain to match), and a created timestamp for ordering the list. Whether all exclusions are active or paused is controlled by the master switch setting (FR-30), not by a per-site field.

## Settings

1. Global highlighting switch (on or off).
2. Excluded sites master switch (on or off): whether the excluded sites list is currently active. When off, all listed sites allow highlighting even though they remain in the list.
3. Excluded sites list (the set of domains where highlighting is suppressed when the master switch is on).
