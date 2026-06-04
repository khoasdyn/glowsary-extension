## 2026-06-04

- Removed the developer manual test page from the extension package.
- Added Glowsary icons and made the toolbar icon switch between on and off states.
- Added CSV import and export for saved words in the management view.
- Added excluded sites so highlighting can be suppressed per domain while saving and management still work.

## 2026-06-03

- Added the toolbar popup with shared highlighting settings and a settings button that opens the management view.
- Allowed saving duplicate words as separate entries and paged their definitions in one sticky popup.
- Changed the highlight underline from red with rounded ends to a straight blue line.
- Added a Markdown formatting rule to prevent awkward paragraph breaks in future documentation edits.
- Cleaned up the agent instruction formatting so each numbered rule reads as one paragraph.
- Tightened the agent instructions for PRD checks, planning, and bug clarification before implementation.
- Renamed the right-click save action and in-page form from note language to Add word and Edit word.
- Reorganized the PRD by adding a document version and moving roadmap and notes content into separate files.
- Changed the management Add new and Edit form to open in a centered modal.

## 2026-06-02

- Added aliases for saved entries, so alternate word forms can highlight with the same definition.
- Moved the Chrome extension files into an `extension/` folder while keeping documentation at the project root.
- Added search and sorting to the saved words management page.
- Changed saved-word highlights from green to red.
- Updated highlighting so saved words are skipped inside links, buttons, navigation areas, labels, and form fields.
- Applied the same skip rule to both the first page scan and newly loaded page content.
- Built the first version of the Glowsary Chrome extension.
- Added saving for words and phrases from webpages.
- Added saved-word highlighting across pages.
- Added definition popups for highlighted words.
- Added a global highlighting toggle.
- Added a management page for adding, editing, and deleting saved entries.
- Stored entries and settings locally in Chrome.
