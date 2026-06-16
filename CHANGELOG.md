## 2026-06-16

- Added an optional image to each saved word, shown as a thumbnail in the definition popup and the word card and opening full size on click, from a local file or a pasted link.
- Added a new `tokens/image-tokens.js` with placeholder image sizes and compression values, flagged for refinement until there is a Figma design.
- Reworked the project docs to a single agent that both plans and builds, with CLAUDE.md as the one source of the rules; the plan-then-paste-back gate stays for code changes.
- Removed the `my-skills` folder (product-planner and design-planner), folded their useful rules and the plan structure into CLAUDE.md, and made working from a Figma link an always-on rule.
- Shrank AGENTS.md to a pointer to CLAUDE.md and updated DESIGN.md so it changes only through an approved plan, with no mention of other agents anywhere.

## 2026-06-12

- Updated the extension display name, kept the short Chrome name as "Glowsary", and bumped the version to 1.3.0.

## 2026-06-11

- Added the centered logo to the management view header and adjusted the header spacing to match the Figma build plan.
- Added pronounce buttons to the definition popup and saved-word cards, speaking the shown word with browser text-to-speech.
- Updated the toolbar popup copy, height, padding, and centered status spacing to match the new 300 by 350 mockup.
- Made the "Add word" right-click menu available in every page context, opening an empty focused Word field when no text is selected.
- Made disabled definition-popup chevrons render in the entry-colored border token.
- Kept the hover definition popup open and anchored while paging between multiple entries.
- Redesigned the hover definition popup with the edit button, full definitions, non-wrapping pagination, and in-page edit panel access.
- Made alias definition popups show the saved alias as the title, matching base word popup layout.
- Vertically centered the Aliases label with its toggle in the entry forms.
- Consolidated toggle styling into the shared Switch component with large and medium sizes, fixed the medium on-state spacing, and let form hints wrap fully.
- Added the Aliases toggle to the in-page save form and Management form panel, with hidden-input defaults and toggle-controlled alias saving.

## 2026-06-09

- Bumped the extension manifest version to 1.2.0.
- Hid the Excluded Sites list container when there are no excluded sites.
- Made the empty saved-word grid show one full-width Add New Word card, moved search misses to plain text below the grid, and corrected the Add New card gray tokens.
- Adjusted the Add Site dialog so empty fields show no validation error until the user types an invalid site.
- Removed the management-view highlight and excluded-sites switches, added the Add Site dialog, and made listed exclusions always active.
- Fixed the toolbar popup text block height so the switch sits at the intended 32px gap.
- Replaced the toolbar popup footer controls with one full-width "Go To App" button and added the share-03 icon asset.
- Aligned in-page Save form typography tokens with the prefixed bundled font names.
- Made saved-word highlight underlines dashed and tinted from each entry's Word Card color, including newest-entry color for shared underlines.
- Loaded in-page Save form fonts from extension-read bytes so strict page CSP cannot block them.
- Fixed in-page Save form font loading by resolving bundled font URLs at runtime in the content script.
- Moved in-page Save form validation messages into the matching field hints instead of the bottom error box.
- Aligned the in-page Save form header, helper text, disabled Save behavior, and bottom-pinned footer with the Management form panel.
- Fixed the in-page Save form manifest asset access, full-height overlay layout, local fonts, and Figma-matched spacing.
- Centralized the Save form and Management form panel fields into one shared entry form component and removed the Save form Cancel button.
- Corrected radius token values and fixed highlight popup sizing, clipping, padding, and long-word wrapping.
- Applied Word Card tokens to the color picker, saved-word grid cards, Add New Word card, and hover definition popup.
- Added radius tokens and scoped Word Card color mode tokens for saved-word cards.
- Fixed the excluded-sites master switch placement so it sits next to the Settings heading.
- Revamped the Settings tab with an inline excluded-sites switch, delete-only site grid, and Backup Data import/export cards.
- Added Management form hints, placeholders, and disabled Save behavior until Word and Definition are filled.
- Shortened the toolbar popup inactive subtitle and reserved text height so the switch stays in place.
- Rebuilt the toolbar popup as the 300 by 400 white card with status copy, shared switch, exclude button state, and settings icon button.

## 2026-06-08

- Rebuilt the management Home tab as a Saved Words header with inline highlighting switch and a clickable word card grid.
- Moved the management view Export and Import buttons from Home to the Settings tab data section.
- Fixed the Management form panel scrim, radius roles, and add-mode delete button visibility.
- Fixed the Color picker selected state to use the Figma check shape and family-colored selected border.
- Rebuilt the management Add/Edit form as the right-side Management form panel with specced fields, color selection, and edit-mode delete.
- Added the shared Color picker component to the in-page save form and management form with one selected color saved per entry.
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
