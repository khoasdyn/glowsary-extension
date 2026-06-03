## Edge cases and decisions to confirm

These are small but should be confirmed before build:

1. Empty or whitespace input. Save should be blocked if Word or Definition is empty after trimming, and if the Word field has fewer than 3 characters after trimming (FR-3a).
2. Phrase spacing. When detecting duplicates and when matching on pages, extra spaces inside a selected phrase should be collapsed to single spaces so “get in” and “get in” are treated as the same.
3. Overlapping entries. If the user saves both “get it” and “get”, a page that contains “get it” matches both. This is now settled by FR-10a: the longer match wins and no text is highlighted twice, so “get it” is highlighted as one entry and “get” inside it is not highlighted separately.
4. Very common words. Saving a word like “the” would highlight most of the page. Version one allows this, but it is worth watching whether a warning is needed later.
5. Editable content and input fields. Highlighting must not apply inside editable or interactive elements such as text boxes, editors, buttons, links, and navigation menus (see FR-9a). This prevents both visual confusion and functional breakage.
6. Alias parsing. Commas split the Alias field. Surrounding spaces are trimmed, empty results from things like a trailing comma or two commas in a row are dropped, and case-insensitive duplicate aliases are removed. An alias equal to the term is dropped (FR-3b).
7. Alias length. Each alias must be 3 or more characters after trimming, the same as the term. A too-short alias blocks the save with a message naming the alias (FR-3c).
8. Shared text across entries. The same text may be a term in one entry and an alias in another, and the same alias text may appear in more than one entry. This is allowed. Highlighting still shows the text once, with the winner decided by longer match first and term over alias on a tie (FR-10a, FR-10b).
9. Selecting an alias on a page. If the user selects text that matches an existing alias and chooses “Create note”, the save form opens that existing entry for editing rather than starting a new note (FR-2a).

## Success signals

Since version one is small, success is mostly about the basic loop working well:

1. A user can save a word and see it highlighted on the current page in one short action.
2. Saved words are reliably highlighted on other sites, including pages that load content while scrolling.
3. The definition popup appears correctly and does not get in the way of reading.
4. Users keep the extension turned on during normal reading rather than disabling it.
