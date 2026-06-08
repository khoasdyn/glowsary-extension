## 2026-06-08

- Updated the management shared header to a centered "Welcome to Glowsary!" title with no subtitle.
- Split the management view into Home and Settings tabs under the shared header while preserving existing saved-word and excluded-site behavior.
- Added the shared management Tab nav component with Home and Settings tabs, token-based styling, and keyboard-accessible tab state.
- Added the reusable Icon Button component with token-based variants, required accessibility inputs, and temporary raw sizing from the design spec.
- Centralized project-local agent skills in `my-skills` and documented how agents discover them.
- Centered the switch knob within the 28px track while preserving the Figma switch size.
- Added shadow tokens and rebuilt all switches with the shared dark-on design and raised knob shadow.
- Renamed the project-local Consultant skill to Product Planner and kept the full planning and documentation workflow.
- Removed the click reveal trigger, added the excluded sites master switch, and changed popup highlighting control to a switch.
- Added the reusable Text Button style across popup, management, and in-page buttons, including the temporary raw sizing values tracked in NOTES.md.
- Added typography token files and mapped extension UI text styles to the shared Figma type scale.
- Moved color token files into `extension/tokens` and updated extension load paths without changing token values.
- Added the light semantic color token layer that references primitive color tokens without changing current UI colors.

## 2026-06-07

- Renamed primitive color CSS variables from the Glowsary-prefixed form to the shorter `--color-*` form.
- Centralized extension UI colors into one Figma primitive token registry and replaced raw UI colors with primitive token references.

## 2026-06-06

- Fixed injected page UI font loading so the definition popup and Add word dialog can use bundled fonts on websites.
- Wired local Copse and Poppins fonts into the extension UI while keeping webpage text unchanged.
- Added a project-local Consultant skill for planning Glowsary changes without editing product code.

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
