## 2026-06-23 (auto-generate uses your own API key only)

- Auto-generate no longer ships a shared key inside the extension. It now runs only on your own Gemini API key, which fixes the recurring "The key was rejected." failures that came from a public, repeatedly blocked shared key.
- The Settings section is renamed from "Custom API Key" to "API Key" and its on/off toggle is removed. The key field is always visible, with one subtitle: "Only Gemini is supported for now. See the video tutorial here." The "here" video link is unchanged.
- Clicking Generate with no key saved now shows "Auto-generate isn't set up yet. Add your Gemini API key in Settings." instead of silently using a shared key. This guidance shows only for the no-key case; a saved key that fails keeps its own message, with no fallback.
- On update, a key you had already saved keeps working and now always powers auto-generate. If you were relying on the old shared key, auto-generate is off until you add your own key.

## 2026-06-20 (Reset button hidden when prompt is default)

- In the Auto-generate Prompt section, the Reset button now appears only when your saved prompt differs from the default. When the prompt already equals the default (including right after a Reset), Reset is hidden, since there is nothing to reset. It still stays hidden while editing, where Cancel and Save take over.

## 2026-06-20 (body font switched to Google Sans Flex)

- The body font changes from Poppins to Google Sans Flex across the whole extension: the in-page UI, the toolbar popup, and the options view. Titles still use the Copse serif. Google Sans Flex was chosen because it covers Vietnamese fully, so definitions now show correct tone marks and đ/Đ.
- Three new font files ship at the 24pt optical size: Google Sans Flex Regular, Medium, and SemiBold (about 390 KB total). The variable font and all other optical sizes are not included. All Poppins files and references are removed.
- A new named text style, Word Definition, is added (body font, regular, text-sm size and line height) and applied to the definition sentence in the in-page popup and on the word card. It matches Body Text's values for now but is its own style so definition text can change later.
- The in-page popup definition now renders at 14px to match the Figma Word Definition style; it was previously 12px. The word card definition is unchanged.

## 2026-06-20 (default prompt character count fix)

- The built-in Auto-generate Prompt now says "Keep it under 350 characters" everywhere. The earlier update had only changed it in the background service worker, so the options page still showed and used the old "300" wording. All copies now match the 350-character limit the rest of the app already uses.

## 2026-06-20 (app language selector and auto-generate prompt)

- The Settings tab now opens with a Language section that sets the language of Glowsary's own interface. English is the only option for now; the choice is saved and restored, but with only English available, picking it has no visible effect yet.
- The old "Auto-generate Language" dropdown is replaced by an "Auto-generate Prompt" section: a single multi-line field holding the instruction sent with each word you generate. It controls the style, tone, and language of the result, so there is no separate language setting anymore.
- The field is read-only by default, showing the current prompt with Reset and Edit buttons. Edit makes it editable and swaps the buttons to Cancel and Save (Reset hides while editing). Save stores the text and is blocked while the field is blank; Cancel throws away the unsaved change; Reset puts the default prompt back at once.
- On update, everyone is reset to the default prompt and any earlier auto-generate language choice is dropped, so the auto-generate action now follows the stored prompt instead of a language code. The default prompt produces a short Vietnamese definition for an English learner; a generated definition still respects the 350-character limit no matter what the prompt asks for.

## 2026-06-20 (image link in CSV backup)

- The CSV backup now carries the color and image-link columns it was always meant to have, so it is five columns by position: term, definition, aliases, color, and image link. Color was previously dropped on export and ignored on import; it now survives a round trip.
- A linked image is saved to the backup as its URL and comes back as a linked image on import. A locally imported picture is not included, so its word returns with no image after an export and import; the picture itself is untouched in the user's own browser.
- Export now shows a short note that linked images are saved and imported pictures are not included, so the user knows what the file holds.
- Import reads the image link without any network check, so it stays offline and fast; a link that no longer works simply shows the error placeholder when the entry is later viewed. Color and the image link are not part of duplicate detection, so re-importing a backup never doubles the list or changes an existing entry.
- Older backups still import by position: a four-column file (no image link) comes in with no image, and a three-column file (no color and no image link) comes in with the default color and no image.

## 2026-06-20 (image error placeholder)

- A saved image that no longer loads now shows an error placeholder instead of disappearing: a centered warning icon above the muted text "Error loading this image.", filling the same image box. It appears in all three places an image shows: the definition popup, the word card, and the edit form.
- In the edit form, the placeholder behaves like any set image: hovering it reveals the delete overlay, so the user can remove the broken image and add another. The popup and card placeholders stay display-only.
- The add-time link check is unchanged: a link that fails when pasted still shows a message below the field and leaves it empty, never the placeholder.

## 2026-06-18 (release 1.4.0)

- Bumped the extension manifest version to 1.4.0 for the Chrome Web Store release.
- Updated the store listing copy and README to promote the two new features in this release: AI auto-generate definitions (with an optional custom Gemini key) and adding an image to a saved word.

## 2026-06-18 (auto-generate failure messages)

- The auto-generate definition hint now names the real cause in plain words instead of one generic line: "The daily limit was reached.", "The key was rejected.", "Can't reach the service.", and so on. The user sees only the plain message; the internal cause code stays in the code for debugging.

## 2026-06-18 (custom key tutorial link)

- The "here" tutorial link in the Custom API Key section now opens the real tutorial video (https://youtu.be/YMmi7SJO23I) instead of the placeholder YouTube home page.

## 2026-06-18 (add card height + custom key toggle reset)

- Gave the "Add New Word" card a fixed 120px height so it never grows or shrinks with content, matching the Figma design.
- The Custom API Key toggle now resets to off whenever it would otherwise be on with no validated key saved: on page load/refresh and when the user switches away from the Settings tab. A saved validated key is never affected.

## 2026-06-18 (saved words grid fix)

- Fixed the Saved Words grid collapsing after changing a setting on the Settings tab and returning to Home. The masonry layout no longer runs while the Home tab is hidden (where cards measure as zero height), and it is recomputed whenever the Home tab becomes visible again, so the grid is always intact on return.

## 2026-06-18 (settings layout refinements)

- Moved the "Add New" button in Excluded Sites from below the heading to the right side of the header row, vertically centered against the title and subtitle.
- Moved the Auto-generate Language dropdown onto the same row as its heading, on the right side, instead of sitting below it.
- Increased the spacing between settings sections from 32px to the `--section-gap` token (64px).
- Updated the shared dropdown (Auto-generate Language and the Home "Sort" dropdown): fixed 200px width, 20px horizontal padding, chevron 20px from the right edge, and 16px Medium label text (was 14px).
- On narrow screens both the "Add New" button and the language dropdown stack full width below their headings.

## 2026-06-18 (custom API key follow-up)

- Switched the Custom API Key toggle to the small size (39×20) to match the alias toggle.
- Tightened the gap between the title and toggle from 16px to 12px.
- Made the subtitle state-dependent: toggle off shows "You're using the default key. See how to add your own key here." and toggle on shows "Only Gemini is supported for now. See how to add your own key here." — "here" links to the tutorial in both states.

## 2026-06-18 (custom API key)

- Redesigned the Auto-generate Key area in Settings into a "Custom API Key" section driven by a single toggle, replacing the old shared/custom radio choice. Off (the default) uses the built-in shared key; on lets the user save their own Gemini key. The subtitle now reads "You can use your own API key. Only Gemini is supported now. See the video tutorial here.", where "here" links to youtube.com in a new tab as a placeholder.
- The section shows four states: toggle off (title, toggle, subtitle only); toggle on with no key (input with the "Paste your Gemini API key" placeholder and a Save button that stays disabled until there is text); toggle on with a typed key that failed the check (the text is kept, Save stays active, a red error shows below); and toggle on with a validated key (a read-only grey field showing the full key, a Delete action, and a green "You are using this key for auto-generate feature." message).
- Save now checks the key first and only stores it if it passes; while checking, the button reads "Checking…" and the field is locked. A failed or unchecked key is never stored. Delete clears the key at once with no confirm, returning to the empty input with the toggle still on. Turning the toggle off keeps the saved key and switches auto-generate back to the shared key; turning it on again restores the key with no re-check.
- Added runtime fallback: when a validated custom key is active but the generate request fails because of that key, the request retries with the shared key so the definition still appears, and a short "Your key didn't work, so the shared key was used." note shows. When the toggle is on with no validated key, auto-generate silently uses the shared key. Note: this fallback note reuses the existing definition message slot, so it currently shows in the red error style even though the definition was filled.
- Migration: on update every existing user is reset to the toggle off and any previously stored custom key is discarded, applied consistently in the options, popup, and content settings so the old field is never written back. No design token value was added or changed; the stale "no success token exists" note in the key styles was removed since `--text-success-primary` now exists and is used for the success message.

## 2026-06-18 (button update)

- Added `xs` size variant to the fill button: 32px tall, 16px horizontal padding, 16px icon — matching the Figma button component.
- Fixed the disabled state: all button kinds now go to 50% opacity when disabled, instead of overriding to a gray background with white text.

## 2026-06-18 (token sync)

- Added `--text-success-primary` semantic color token (Green/700, #15803D) from the Figma Semantic Colors export.
- Added `--card-gap` spacing token (16px) from the Figma Spacing export.
- Renamed the `--label-field` spacing token to `--label-field-gap` to match the Figma Spacing export name.

## 2026-06-18

- Redesigned the Definition field's auto-generate action into a special gradient "Generate" button, in both the in-page Add/Edit form and the Management panel. It is renamed from "Auto-generate" to "Generate", shown as a fully-rounded pink-to-purple gradient pill with white text and the new `star-06` sparkle icon on its right. On hover (when active) the button lifts slightly, glows in soft pink/purple, the gradient shimmers, and the star rotates and grows — a catchy, premium feel. The accessible name stays "Generate definition". No generate behavior changed: it still unlocks at 3+ characters, sends only the word, shows "Generating…" while it runs, and falls back to manual typing on failure.
- Added a new Gradient token category in `tokens/gradient-tokens.js` with `--gradient-generate` (linear-gradient from #fa71cd to #c471f5), taken from the Figma "Gradient/Linear/58" style (node 555:3337). The file is loaded everywhere the other token files are. Flagged: this is the first gradient token and a new design value introduced with this build; the hover glow uses a `color-mix` of the existing fuchsia and purple primitives, and the disabled (muted) and loading (spinning star) looks are build defaults since Figma shows only the active state. Listed `star-06.svg` as a web-accessible resource so the in-page form can load it.
- Redesigned the image field in the Add/Edit form (in-page form and Management panel) and moved it directly below the Definition field, so the field order is now Word, Definition, Image, Alias, Color, with keyboard tabbing following the same order. The empty field shows a clean drop box (a photo icon and the "PNG, JPEG or WEBP, up to 5MB" hint only, with the old wording removed) above a paste-link row: a single-line input and a round dark submit button. The link now loads only when the submit button or Enter is pressed, never on every keystroke, and the button stays faded and inactive until the input has text. Drag, click-to-browse, and paste of a local file still work.
- After an image is set, the field collapses to show only the image inside a fixed full-width 150px box, scaled to fit with the `bg-secondary` background filling any gap (never cropped); both the drop box and the paste-link row are hidden. Hovering the image dims it and reveals one round red delete button; removing returns the field to the empty state. There is no more Replace control. The loading spinner (icon, animation, short delay, and locked-while-busy behavior) is unchanged and now also shows in the box while a pasted link loads. A wrong local file or a dead link shows a short message below the field and returns it to empty, keeping the rest of the form.
- Added a new image token `--image-overlay-hover-bg` for the dark hover scrim over the uploaded image (equals rgba(0,0,0,0.6), expressed through the black primitive), and a shared `--image-box-height` (150px) from the Figma image-field frame (352x150). Retired the now-unused tokens `--image-thumb-size`, `--image-thumb-radius`, `--image-dropzone-min-height`, and `--image-spinner-overlay-bg` that belonged to the old preview/thumbnail layout. Flagged: the overlay color is a new design value introduced with this build.
- Listed the existing `arrow-up.svg` (submit) and `image-03.svg` (drop area) icons as web-accessible resources so the in-page form can load them; the delete button reuses `trash-03.svg`. The `upload-01.svg` icon is no longer used by this field.
- Fixed the word list jumping back to the top after saving. Adding, editing, or deleting a word no longer resets the page scroll: the view stays exactly where it was, so a card edited near the bottom of the list stays in view instead of forcing the user to scroll back down. The position holds even once image-bearing cards finish settling their height.
- Changed how a saved word's image is shown on the word card and in the definition popup. The image now sits below the definition (order: term/title, definition, image, then alias pills or pagination) inside a calm full-width box that is always 120px tall, with a `bg-secondary` background and the `--box` (12px) corner radius. The whole image is shown contained and centered, never cropped or stretched, so the background fills any gap around very wide or very tall images. While the image loads, the box shows a subtle skeleton placeholder so the layout never jumps; if the image fails to load, the whole image area is hidden with no broken-image icon or message. An entry with no image shows no box and no reserved space. On a multi-entry popup, each page shows its own entry's image and a page with no image shows no image area.
- The image is no longer interactive: it cannot be clicked and there is no hover affordance. Removed the full-size image viewer entirely (its module, styles, and load wiring), since the only thing that opened it was the now-removed click-to-enlarge on these two surfaces. No add, replace, remove, storage, or compression behavior changed. The skeleton uses the existing `--bg-quaternary` token as a quiet pulsing fill; no token value was added or changed.

## 2026-06-17

- Word cards in the management view now show the full definition with no truncation and no ellipsis, so the user can read the whole text without opening the card. Cards no longer have a fixed height; each grows to fit its own content and the grid packs them in a masonry layout, so shorter cards no longer leave empty space below them. The word title still stays on one line and truncates with an ellipsis when it is too long, and a card with no aliases adds no extra height.
- Added a Spacing token category in the new `tokens/spacing-tokens.js`, generated from the Figma spacing export: `--section-gap` (64px), `--field-gap` (24px), `--label-field` (6px), and `--button-gap` (8px). The file is loaded everywhere the other token files are. The tokens are created only, not yet applied to any layout.
- Added three new semantic color roles from the Figma semantic export: `--text-placeholder` (Gray/400), `--fg-quaternary` (Gray/500), and `--border-primary_focus` (Gray/900). The focus token keeps Figma's exact underscore spelling. The tokens are created only, not yet applied to any element.
- Synced the Radius export: no change, the tokens already matched Figma exactly. No existing color or radius value changed in this sync.
- Added a custom Gemini key option for auto-generate in the Settings tab. A new "Auto-generate Key" control lets the user keep the built-in shared key (the default, so nothing changes unless they switch) or paste their own Gemini key. Saving a custom key checks it with one small request and shows "works" or a short error right below the field. With a working custom key active, every auto-generate request (in-page form and Management panel) uses it; when custom is active but no key is set, the action points the user to Settings instead of falling back to the shared key. The choice and the key are stored locally and restored next time. Key handling stays in the background worker, so the custom key is never exposed on the pages the user visits.
- Flagged design debt: the design system has no success/positive color role token, so the "Your key works." message uses neutral primary text while errors use the existing error color. No new token was invented; add a success role token (with a Figma value) to give the working message a positive color.
- Switched the auto-generate model to Gemini 3.1 Flash Lite: lighter and faster for short definitions and easier on the shared free-tier quota.
- Added an optional auto-generate action to the Definition field, in both the in-page Add/Edit form and the Management form. It stays disabled until the Word has at least 3 characters, sends only the word (never the page or surrounding text), generates one short definition in the chosen language, overwrites the field, and keeps the result within the 350-character limit. While it runs the button shows "Generating…" and the Definition field is locked; on failure it shows a short "type it in" message and keeps everything the user entered.
- Added an Auto-generate Language dropdown (English or Vietnamese) to the Settings tab. The choice is stored locally, restored next time, and only affects future generate actions, never a saved word.
- Routed the generation through the background worker, which calls Google's Gemini free tier — Glowsary's first network call, a deliberate exception to the local-only rule. The shared key lives in one place, `auto-generate-config.js`, loaded only by the background worker so it is never exposed on the pages the user visits. The key ships empty and must be pasted in before the action works.
- Made the hover definition popup reliable on every site where a word is highlighted (for example vietnamnews.vn, where it showed nothing before). Three causes were fixed: the popup was being closed the instant it opened by scroll events from unrelated page widgets like carousels and tickers, so it now closes only when the page or the word's own container scrolls; hover handling was moved off each underlined word onto the document so it survives sites that rebuild, clone, or re-render the page; and the "keep open" check no longer relies on the host page's hover state, using the real pointer position instead so it can re-attach the popup to a word that was rebuilt under a resting pointer. The popup also recovers its content if a word is rebuilt and now appears when the pointer is already resting on a word as its highlight shows up. Popup content, layout, position, sticky behavior, and pagination are unchanged.
- Added a working spinner to the image field while a local image is processed: it shows only after a short delay so fast images never flash it, sits in the dropzone on a first add, and overlays the current thumbnail (which stays visible) on a replace, then clears back to the previous state on success or error. The field is locked against a second file while busy, and pasted image links are unaffected.
- Added placeholder spinner tokens to `tokens/image-tokens.js` (ring size, stroke thickness, and the overlay scrim), flagged as design debt until there is a Figma design; the delay and spin timing are tuning values set in the build.
- Moved the design token definitions into the shadow root too, re-scoped to the host, so the Add/Edit panel and definition popup take every color and font value from inside the isolated UI instead of the host page; this fixes the lost white background and the wrong (serif) typeface on the few sites that defined a clashing variable or blocked our page-level styles. No token name or value changed.
- Moved the in-page Add/Edit panel, the definition popup, and the full-size image viewer into a shadow root so the host site's CSS can no longer change their background, padding, spacing, layout, or sizing; they now render with the correct Glowsary design on every site, including hostile ones. Word highlights stay in the page.

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
