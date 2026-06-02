## Overview

Glowsary is a Chrome extension that adds a personal vocabulary layer over the web. When a user reads English content and looks up a word or phrase, they save it with their own definition. After that, the saved word or phrase is highlighted everywhere it appears on the web, and the saved definition shows up in a small popup when the user hovers or clicks it.

The closest reference is Word Wise on a Kindle. The difference is that the highlights come from the user’s own saved words, not a fixed list, and the definition stays hidden until the user asks for it.

This document describes version one only. It is intentionally small and focused on shipping something useful, not complete.

## Problem

People who learn English by reading articles, blogs, and social posts on sites like Medium and Substack have no good way to remember which words they have already looked up. When they meet a word again on a different page, there is no visual sign that they once searched for it. Each new page feels like the first time. This slows learning and wastes the effort already spent looking words up.

## Goals

The product should help a reader recognize words they have already looked up, with as little effort as possible, while they read anywhere on the web.

In version one the goals are:

1. Let the user save a word and a definition quickly while reading.
2. Highlight every saved word across all websites so the user recognizes it on sight.
3. Show the saved definition on demand without leaving the page.
4. Let the user manage their saved words in one place.

## Non-goals

Version one is a passive memory aid. It is not a study tool. The following are out of scope:

1. Flashcards, quizzes, spaced repetition, or any review mode.
2. Tracking progress or marking a word as “learned”.
3. Matching word forms (saving “love” will not highlight “loved” or “loving”).
4. Auto-filling definitions from a dictionary.
5. Multiple meanings stored under one word or phrase.
6. Cross-device sync or user accounts.

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

- FR-1: The user can select a single word or a multi-word phrase on any web page, right-click, and choose a “Create note” action from the context menu.
- FR-2: Choosing the action opens a small in-page UI with two fields: Word and Definition. The Word field is pre-filled with the exact text the user selected, including phrases such as “get in”.
- FR-2a: If the selected text already matches a saved entry (ignoring capitalization), the UI opens that existing entry with its saved definition loaded, so the user edits it instead of creating a duplicate.
- FR-3: The user can edit the Word field and type the Definition by hand. Both fields are required to save.
- FR-3a: The Word field must contain at least 3 characters after trimming spaces. This blocks very short entries like “a”, “is”, and “at”. The count is measured on the whole field, so a phrase like “get in” (6 characters) is allowed even though “in” alone is short. This also blocks short real words such as “go” and “ID”, which is accepted for version one.
- FR-4: The user clicks Save to store the entry locally.
- FR-5: After a successful save, all matching words or phrases on the current page are highlighted immediately, without a page reload.

### Matching and highlighting

- FR-6: Matching is exact text only, for both single words and phrases. Saving “love” matches “love” and does not match “loved”, “loves”, or “loving”.
- FR-6a: A saved phrase is matched only when its words appear together, in the same order, as a contiguous sequence. Saving “get in” matches “get in” but does not match “get” and “in” appearing separately.
- FR-7: Matching is whole-word only at the edges. “love” does not match inside “glove” or “lovely”, and “get in” does not match inside “forget invoices”.
- FR-8: Matching ignores case. Saving “love” highlights “love”, “Love”, and “LOVE”.
- FR-9: A highlighted word or phrase is shown with a Grammarly-style underline. The style must be subtle and must not break or strongly clash with the page’s own design.
- FR-9a: Highlighting must not be applied to text inside interactive or navigational elements. Specifically, text inside `<a>` (hyperlinks), `<button>`, `<nav>`, `<input>`, `<label>`, `<select>`, and `<textarea>` elements must never be highlighted. This rule exists for two reasons: the underline style can be visually confused with a hyperlink, and modifying interactive elements risks breaking their behavior or appearance. If a saved word appears both in a link and in plain body text on the same page, only the plain body text instance is highlighted; the link instance is skipped.
- FR-10: Highlighting watches the page for new content and highlights matching words or phrases as that content appears, so it keeps working on pages that load more text while scrolling or that update without a full reload.
- FR-10a: No text is highlighted twice. When two saved entries could match the same text, the longer match wins. For example, if both “get it” and “get” are saved, the text “get it” is highlighted as one entry, “get it”, and “get” inside it is not highlighted separately.

### Viewing a definition

- FR-11: The user can reveal a saved word’s definition by hovering over a highlighted word or by clicking it.
- FR-12: The definition appears in a small popup placed next to the word.
- FR-13: A setting lets the user choose whether hover or click is the trigger. Both behaviors must be built.

### Global on and off

- FR-14: The extension has a single global on/off switch that controls all highlighting.
- FR-15: When the switch is on, saved words are highlighted on every website.
- FR-16: When the switch is off, no highlighting appears on any website. Saving and managing words still work.

### Managing saved words

- FR-17: The extension provides a management view that lists all saved words and phrases with their definitions.
- FR-17a: The management view has an “Add new” button that opens the same Word and Definition form with empty fields. It uses the same rules as saving from a page: the 3-character minimum (FR-3a), both fields required, and the case-insensitive duplicate check (FR-2a). If the typed term already exists, the form opens that existing entry for editing instead of creating a copy.
- FR-18: From the list, the user can edit an entry’s definition. Editing replaces the existing definition. An entry holds only one definition.
- FR-19: From the list, the user can delete a saved entry. After deletion, that word or phrase is no longer highlighted anywhere.

### Storage

- FR-20: All saved words and settings are stored locally in the browser. There is no account and no cross-device sync in version one.

## Core user flow

1. The extension is installed and the global switch is on.
2. The user is reading an article, for example a Substack post.
3. The user meets a word or phrase they do not know and wants to save it.
4. The user selects the word or phrase, right-clicks, and chooses “Create note”.
5. The in-page UI appears with the Word field pre-filled with the selected text. The user types the definition and clicks Save. If the text was already saved, the UI instead opens the existing note for editing.
6. Every instance of that word or phrase on the current page is highlighted right away.
7. Later, on the same site or any other site, the user hovers or clicks a highlighted instance and sees the saved definition in a popup.
8. The user opens the management view to edit or delete saved entries as needed.

## Data model

Each saved entry holds the word or phrase, the definition, and a created timestamp. A suggested shape:

> term: the text to match (word or phrase), stored in a normalized lowercase form for matching displayTerm: the text exactly as the user typed it, shown in the list definition: the user’s typed meaning createdAt: when the entry was saved

Storing a normalized lowercase form supports case-insensitive matching (FR-8) and case-insensitive duplicate detection (FR-2a), while keeping the user’s original text for display in the list.

## Settings

1. Global highlighting switch (on or off).
2. Reveal trigger (hover or click).

## Edge cases and decisions to confirm

These are small but should be confirmed before build:

1. Empty or whitespace input. Save should be blocked if Word or Definition is empty after trimming, and if the Word field has fewer than 3 characters after trimming (FR-3a).
2. Phrase spacing. When detecting duplicates and when matching on pages, extra spaces inside a selected phrase should be collapsed to single spaces so “get in” and “get in” are treated as the same.
3. Overlapping entries. If the user saves both “get it” and “get”, a page that contains “get it” matches both. This is now settled by FR-10a: the longer match wins and no text is highlighted twice, so “get it” is highlighted as one entry and “get” inside it is not highlighted separately.
4. Very common words. Saving a word like “the” would highlight most of the page. Version one allows this, but it is worth watching whether a warning is needed later.
5. Editable content and input fields. Highlighting must not apply inside editable or interactive elements such as text boxes, editors, buttons, links, and navigation menus (see FR-9a). This prevents both visual confusion and functional breakage.

## Out of scope for now, possible later

These ideas would turn the tool from a recognition aid into a learning tool. They are parked for after launch:

1. Matching word forms so “loved” highlights when “love” is saved.
2. Auto-filling definitions from a dictionary.
3. Multiple meanings per word or phrase.
4. Cross-device sync with an account.
5. A review or practice mode (flashcards, spaced repetition).
6. Search and sort in the management view, and showing the source page where an entry was saved.

## Success signals

Since version one is small, success is mostly about the basic loop working well:

1. A user can save a word and see it highlighted on the current page in one short action.
2. Saved words are reliably highlighted on other sites, including pages that load content while scrolling.
3. The definition popup appears correctly and does not get in the way of reading.
4. Users keep the extension turned on during normal reading rather than disabling it.