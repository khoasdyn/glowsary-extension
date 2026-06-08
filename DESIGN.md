# Glowsary design system

This file holds the rules and structure of the Glowsary design system. It does not hold the exact values. The exact values for color, typography, radius, and later spacing live in one central place in the code, as design tokens. Figma is the master source those values come from.

This file currently covers typography, color, and corner radius. Spacing and more come later.

## How the design system is organized

The system has three layers, and updates flow in one direction.

1. Figma is the source of truth. The user updates Figma first, so it always holds the latest design.
2. The code holds the central design tokens: the exact values, defined once in one place, used everywhere. This is the precise registry the code reads from.
2a. All token files live together in one folder, `extension/tokens`. Each token category has its own file inside that folder, for example `tokens/color-tokens.js` for the color primitives and `tokens/semantic-color-tokens.js` for the color roles. Typography goes there next, and spacing and radius follow as they are added. The files sit side by side, but each stays separate, so one Figma export maps to one file.
2b. Layers per category: a category always has a primitive file, and it has a second semantic file only when the design actually defines semantic tokens for it. Color has both. Typography has a primitive scale plus the named text styles, which act as its semantic layer. Spacing and radius are expected to have only a primitive scale for now. Never invent a semantic layer the design does not have.
3. This file holds the rules and structure: what tokens exist, how they are named, what each is for, and what agents may and may not do. It does not repeat the exact values.

Sync rule: when the user shares a Figma link or asks for a check, Claude reads Figma, hands the updated values to Codex through a plan so Codex updates the central tokens, and keeps this file's rules in step. If Figma and the code tokens ever disagree, Figma is right.

## Rules for agents

1. Use only the tokens that already exist. Do not invent new colors, sizes, radii, or spacing.
2. Never hardcode a raw value, such as a hex color or a pixel size, inside a component. Always reference the central token.
3. If a value you need does not exist as a token, do not guess. Stop and tell the user, so the user adds it in Figma first and Claude adds the token.
4. Token names match across Figma, this file, and the code, so there is no guessing.
5. Only Claude maintains this file. Codex reads the tokens and this file, and never edits this file.
6. Component styles always come from this file. The Components section below is the single style guide for shared UI components (Text Button, input, card, and so on). When you build or change a component, match its spec here. Do not invent a component style that is not in this section; if one is missing or unclear, stop and tell the user so Claude adds it from Figma first.

## Typography

Two font families: Copse is the heading font, a serif, used for titles. Poppins is the body font, used for body text and all UI controls.

The exact type values live as tokens, generated from the Figma type scale. There are four token groups: font size (named `--font-size-{step}`, with steps `text-xs` through `display-2xl`), line height (named `--line-height-{step}`, with the same steps), font family, and font weight. The code references these tokens and never writes a raw size or line height.

Font files that ship: Copse Regular (400), Poppins Regular (400), Poppins Medium (500), and Poppins SemiBold (600). Bold (700) and all italic styles exist as tokens in Figma but have no font file, so the UI must not use them yet. Copse ships only Regular, so every title renders at weight 400; heading strength comes from size, not from bold weight.

Named text styles, taken from Figma. Each one is a font family, a weight, a size token, and the matching line height token:

1. Page Title: heading font, regular, the `display-md` size and line height. The main page title.
2. Section Title: heading font, regular, the `display-xs` size and line height. Section headings and dialog titles.
3. Card Title: heading font, regular, the `text-lg` size and line height. The saved word shown on a card.
4. Subtitle Page: body font, regular, the `text-md` size and line height. The subtitle line under a page title.
5. Body Text: body font, regular, the `text-sm` size and line height. Body text, definitions, input values, and list text.

Text that is not a named style uses the scale tokens directly: field labels and button text use the body font at the `text-sm` size with medium weight; hints and helper text use the body font at the `text-xs` size; alias chips use the heading font at the `text-xs` size. These may become named styles later if Figma adds them.

Notes: every custom font keeps the system font stack as a fallback, so text still shows if a font fails to load. The in-page content UI uses its own prefixed font names so it does not clash with the host page's fonts.

## Color

All color comes from one file, `extension/tokens/color-tokens.js`. This file is the single source of color for the whole extension. It is generated from the Figma color export, so Figma stays the upstream source. The file holds the full primitive color library: every color family and every step from Figma (steps 50 to 950), plus Base white, black, and transparent, and a Neutral alpha set. The values match Figma exactly.

Token names follow one pattern: `--color-{family}-{step}`, for example `--color-slate-700` or `--color-emerald-600`. The family and step names match the Figma names, so any token traces straight back to its Figma variable. The file exposes these tokens as CSS variables for the UI, and also as plain values for code that runs without CSS, such as the service worker that sets the toolbar badge color.

Rule for all color: the UI never uses a raw color value (no hex, rgb, rgba, or named color). Every color references a token from this file. The only place raw color values live is this one file.

The system has two color layers. The first is the primitive layer in `extension/tokens/color-tokens.js` described above. The second is the semantic layer in `extension/tokens/semantic-color-tokens.js`: a file that gives colors a role, such as the main text color or the page background. Each semantic token references a primitive token, never a raw value, so the primitives stay the single source of the actual color.

Semantic tokens use short role names, for example `--text-primary`, `--bg-secondary`, `--fg-error-primary`, and `--border-primary`. They are grouped as Text (text fills), Foreground (icons and graphic marks), Background (surfaces), and Border. The set is small and matches the Figma semantic export exactly. It covers one mode, light, for now; a dark mode would be added later as a second mode.

Adoption note: the semantic layer exists, but the UI still uses primitives directly for now. Switching each screen to the matching semantic role is a separate, later step, done from the Figma screens so each element gets the right role. When that happens, the neutral grays (currently a mix of Slate, Neutral, Gray, and Mist) will settle onto the single Gray family that the semantics use.

Note: the per-word color picker is now in PRD.md (FR-3e, FR-17f, FR-17g) and specced in the Components section as "Color picker". Its four colors map to existing primitive tokens (Purple 200, Green 200, Blue 200, Yellow 200) and the selected check uses the family's 800 step, so no new color tokens are needed. See the Color picker entry for the full spec.

## Corner radius

A small scale by role: small for chips, medium for cards, inputs, and list rows, large for the dialog, and full for fully rounded shapes like buttons, the switch, the Tab nav, icon buttons, and the color circles.

The fully rounded value in code: in Figma a fully rounded shape is sometimes drawn with 99, 999, or 9999. These all mean the same thing. In code, do not copy those mixed numbers. Use `border-radius: 9999px` for pill shapes and fully rounded rectangles, and `border-radius: 50%` for true circles, where the element has equal width and height.

## Shadows

Shadows are the first effect category. Like color and typography, the exact values come from Figma and live as central tokens in the code, in their own file `extension/tokens/shadow-tokens.js`, generated from the Figma effect export. The code references these tokens and never writes a raw shadow value.

Figma defines shadows in two parts: a few shadow effect colors, and one composite effect style built from them.

Shadow effect colors: these are Base black at low opacity, matching the Figma effect color variables one to one. Each one references the `--color-base-black` primitive and applies the opacity from Figma, so no raw color lives outside `color-tokens.js`. There are three: `--shadow-xs` (black at 5%), `--shadow-skeumorphic-inner` (black at 5%), and `--shadow-skeumorphic-inner-border` (black at 18%). The names keep Figma's spelling, including "skeumorphic", so each token traces straight back to its Figma variable.

Composite effect style: `--shadow-xs-skeuomorphic` is the named shadow style, the same idea as a named text style in Typography. It stacks three layers, in this order, using the effect colors above: an outer drop shadow in `--shadow-xs`, offset 0 down 1, blur 2, spread 0; an inner shadow in `--shadow-skeumorphic-inner`, offset 0 up 2, blur 0, spread 0; and an inner shadow in `--shadow-skeumorphic-inner-border`, offset 0, blur 0, spread 1. This is the soft, raised, skeuomorphic look used by the switch knob.

This is a brand new category, so the section names the layer offsets, blur, and spread from Figma directly, so an agent can build the token without guessing. The opacity values (5% and 18%) are the Figma effect color values, not a value mixed from any gray family.

## Icons

Icons are SVG assets in one folder, `extension/assets`, one file per icon, named for the icon, for example `trash-03.svg` and `settings-02.svg`. Agents take icons from this folder. The names match the Figma icon names so each file traces back to its source.

A Figma icon export cannot link to a color token, so each SVG ships with a fixed color from Figma. That color in the file is only a placeholder; the icon does not get its final color from the file. Where the icon is used, it takes the color of its context, so the foreground token of the Icon Button variant or the Text Button drives it. Applying that color is done at the point of use, not in the asset.

The standard icon slot is 18 by 18, used by the Icon Button and the Text Button trailing icon. An icon drawn at another size is scaled to fit the slot.

## Spacing

Not defined yet. To be added.

## Components

This section is the single style guide for shared UI components, detailed enough that a plan can simply point an agent here instead of restating the spec. Each component lists the tokens it uses by role, so the code reads from tokens, never from raw values. A component is added here only after Figma defines it. Where a value has no token yet (for example spacing and sizing), the spec gives the exact value from Figma as a clearly marked temporary value and records the gap in NOTES.md, so an agent can still build the component and we replace the raw value with a token once the scale exists.

### Text Button

The Text Button is the standard action button. It always shows a text label, which is what sets it apart from an icon-only button, so it is named Text Button. It has one optional trailing icon and comes in four variants: Default, Secondary, Destructive, and Disabled. In Figma the component exposes a variant property (the state), the label text, a show or hide toggle for the trailing icon, and a slot to pass a custom icon.

Anatomy: a single centered row, the label first and one optional trailing icon after it. There is no leading icon. No variant has a border or a shadow.

Variants, with colors from existing semantic tokens. Background is the surface, text is the label color, icon is the trailing icon color:

1. Default: background `--bg-primary-solid`, text `--text-white`, icon `--fg-white`. The primary, solid dark button, for the main action.
2. Secondary: background `--bg-quaternary`, text `--text-primary`, icon `--fg-primary`. A light gray button, for secondary actions.
3. Destructive: no background fill (transparent) and no border, text `--text-error-primary`, icon `--fg-error-primary`. For destructive actions such as delete.
4. Disabled: background `--bg-quaternary`, text `--text-white`, icon `--fg-white`. The faded, non-interactive look. In Figma this differs from Default only by the gray background.

Typography: the label uses the body font (Poppins) at the `text-sm` size and `text-sm` line height, Medium weight, with letter spacing 0. This is the shared button text style already noted under Typography. The label stays on a single line: it does not wrap, and if it is too long it is cut with an ellipsis.

Icon: the trailing icon is optional and is 20 by 20. It takes the icon (foreground) token of its variant, so it always matches the label color. The share-style icon in Figma is only a sample; the real icon is passed in by the caller. The app's current buttons are all label only, so they show no icon.

Radius: the `full` role, a fully rounded pill.

Sizing and spacing (temporary raw values, not yet tokens): a fixed height of 40, inner padding of 12 top and bottom and 20 left and right, and a gap of 8 between the label and the trailing icon. The trailing icon is 20 by 20. The button has no fixed width; it sizes to its content. These numbers are the one place this file holds raw values, because no spacing or sizing scale exists yet. This is temporary debt tracked in NOTES.md; replace these with tokens once the scale is defined in Figma.

States not yet designed: there is no hover, focus, or pressed style in Figma yet, and the Destructive variant has no background or border, so it reads as plain red text for now. Both are tracked in NOTES.md and wait on a design decision.

### Switch

The Switch is the pill on/off toggle. It is used for the global highlighting switch (in the toolbar popup and the settings bar, sharing one state) and for the excluded sites master switch. In Figma the component exposes one boolean property, Active, with two states: off (Active=No) and on (Active=Yes).

Anatomy: a rounded pill track with a round white knob inside. The knob sits against the left edge when off and slides to the right edge when on. The knob position is what shows the state.

Variants, with colors from existing semantic tokens. Track background, track border, and knob fill:

1. Off (Active=No): track background `--bg-quaternary`, track border a 1px solid `--border-primary`, knob fill `--bg-primary` (white). The knob sits on the left.
2. On (Active=Yes): track background `--bg-primary-solid`, no border, knob fill `--bg-primary` (white). The knob sits on the right.

These are the same two surfaces as the Text Button (light gray and solid dark), so the on state is the dark brand color, not a separate accent color.

Knob shadow: the knob carries the `--shadow-xs-skeuomorphic` style (see Shadows) in both states, which gives it the soft raised look. The track has no shadow.

Radius: the `full` role. The track is a pill (`9999px`); the knob is a true circle (`50%`), since it has equal width and height.

Sizing and spacing (temporary raw values, not yet tokens): the track is 54 wide and 28 tall, with 4 padding top and bottom and 6 padding left and right; the knob is 20 by 20. With that padding, the knob travels from the left edge to the right edge between the two states. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

States not yet designed: Figma defines only the off and on states. There is no disabled, hover, or pressed style yet, and there is no focus style. Because keyboard users must still see which control is focused, the switch keeps a visible keyboard focus indicator until Figma defines one; this is tracked in NOTES.md and waits on a design decision. The motion of the knob between states is a small slide; an exact timing is not set in Figma yet.

### Icon Button

The Icon Button is a round, icon-only button. It shows a single icon and no text label, which is what sets it apart from the Text Button. It is used for compact actions where space is tight or the meaning is clear from the icon, such as a Delete (trash) action. In Figma the component exposes a variant property (the style) and a slot to pass a custom icon. It comes in three variants: Primary, Secondary, and Destructive. No variant has a border or a shadow.

Anatomy: a fixed square box with the icon centered inside it. The box is fully rounded, so it reads as a circle. There is one icon and nothing else.

Variants, with colors from existing semantic tokens. Background is the surface, icon is the icon color:

1. Primary: background `--bg-primary-solid`, icon `--fg-white`. The solid dark button, for the main icon action. This is the icon-only match of the Text Button's Default variant.
2. Secondary: background `--bg-quaternary`, icon `--fg-primary`. A light gray button, for secondary actions.
3. Destructive: background `--bg-error-solid` (a solid red fill), icon `--fg-error-white`. For destructive actions such as delete. Note this differs from the Text Button's Destructive, which has no fill and shows plain red text; the Icon Button's Destructive is a filled red circle, so it reads stronger.

Icon: the icon is required and is 18 by 18. It takes the icon (foreground) token of its variant, so it always matches the variant. The trash icon in Figma is only a sample; the real icon is passed in by the caller.

Radius: the `full` role. The box has equal width and height, so it is a true circle (`50%`) per the corner radius rule.

Sizing and spacing (temporary raw values, not yet tokens): a fixed box of 40 by 40, with the icon 18 by 18 centered inside. The button has no label and no fixed content sizing beyond the icon. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

Accessibility: because the button has no visible text, it must carry an accessible name so screen readers can announce its action, and a tooltip on hover so sighted users learn what it does. The caller provides this name and tooltip text. This is a build requirement, not a Figma value.

States not yet designed: Figma defines only the three static variants. There is no hover, focus, pressed, or disabled style yet. Because keyboard users must still see which control is focused, the Icon Button keeps a visible keyboard focus indicator until Figma defines one; this is tracked in NOTES.md and waits on a design decision.

### Tab nav

The Tab nav is the two-tab switch at the top of the management view, below the shared header. It switches between the Home tab and the Settings tab. In Figma the component exposes one property, page, with two values, Home and Settings, which sets the active tab.

Anatomy: a rounded pill track that holds two equal-width items side by side, the Home item first and the Settings item second. Each item is one leading icon followed by a text label, centered together as a row. The active item is filled with a white pill; the inactive item has no fill, so the track shows behind it. The white fill is the only thing that marks the active tab; the label and icon colors do not change between the active and the inactive item.

Items and icons: the Home item uses the home-smile icon with the label "Home"; the Settings item uses the settings-02 icon with the label "Settings". Both icons already ship in `extension/assets` (home-smile.svg, settings-02.svg).

Variants, with colors from existing semantic tokens. Track background, active item background, label color, icon color:

1. Home active (page=Home): the Home item background is `--bg-primary` (white); the Settings item has no fill. Track background `--bg-tertiary`.
2. Settings active (page=Settings): the Settings item background is `--bg-primary` (white); the Home item has no fill. Track background `--bg-tertiary`.

In both states the label color is `--text-primary` and the icon color is `--fg-primary`, the same for the active and the inactive item.

Typography: the label uses the body font (Poppins) at the `text-md` size and `text-md` line height, Medium weight, with letter spacing 0. This is not one of the five named text styles; it uses the scale tokens directly with medium weight. Figma names this style "Text md/Medium".

Icon: each item has one leading icon, 24 by 24, taking the `--fg-primary` color. This is larger than the standard 18 by 18 icon slot used by the Text Button and the Icon Button, so the Tab nav uses a 24 by 24 icon slot.

Radius: the `full` role for both the track and the items. The track is a pill (`9999px`) and each item is a pill (`9999px`).

Sizing and spacing (temporary raw values, not yet tokens): the track has a fixed height of 60, 6 padding on all sides, and a gap of 16 between the two items. Each item has 16 padding left and right, 12 padding top and bottom, and a gap of 12 between its icon and label. The two items share the width equally, each taking half, so the nav stretches to fill the width of its container and has no fixed width. The icon is 24 by 24. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

States not yet designed: Figma defines only the two active states, Home active and Settings active. There is no hover, focus, pressed, or disabled style. Because the active tab is shown by the white fill alone, and keyboard users must see which tab is focused, the Tab nav keeps a visible keyboard focus indicator until Figma defines one; this is tracked in NOTES.md and waits on a design decision.

### Color picker

The Color picker is the row of fixed color choices used to tag a saved word, shown in the Color field of the in-page save form and the Management form panel. It maps to PRD.md FR-17f. Its color is a visual tag for the entry's card only; it does not change on-page highlighting (PRD.md FR-3e). In Figma it is a single row of color circles where exactly one is selected.

Anatomy: a left-aligned horizontal row of four color circles in a fixed order. Each circle is a solid color fill. The selected circle shows a check mark centered inside it; the unselected circles show only their fill. Exactly one circle is always selected.

Colors, taken from existing primitive tokens (no new tokens needed), in order: the first circle `--color-purple-200`, the second `--color-green-200`, the third `--color-blue-200`, the fourth `--color-yellow-200`. The first circle is the default for a new entry. These are intentional primitive uses: the palette is a fixed decorative set with no semantic role, so no semantic token fits, which is the allowed case for using a primitive directly.

Selected state: the selected circle shows two marks together, a 1px solid border around the circle and a check mark centered inside it, both in the family's 800 step. So the purple circle uses `--color-purple-800`, the green circle `--color-green-800`, the blue circle `--color-blue-800`, and the yellow circle `--color-yellow-800` for both its border and its check. Unselected circles have only their 200 fill, with no border and no check. The mockup shows the purple state, and the family 800 rule for the other three was confirmed by the user (decision 2026-06-08).

Check icon: the check mark is 20 by 20, centered in the 40 by 40 circle, and takes the selected circle's 800-step color as its foreground.

Radius: the `full` role. Each circle has equal width and height, so it is a true circle (`50%`) per the corner radius rule.

Sizing and spacing (temporary raw values, not yet tokens): each circle is 40 by 40, and the gap between circles is 12. The row sizes to its content and has no fixed width. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

States not yet designed: Figma defines only the resting selected and unselected look. There is no hover, focus, or pressed style yet. Because the user picks a color with the keyboard as well as the pointer, the Color picker keeps a visible keyboard focus indicator until Figma defines one; this is tracked in NOTES.md and waits on a design decision.

### Field input

The Field input is the standard single-line text field with a label and a hint. It is used for the Word and Aliases fields in the in-page save form and the Management form panel. In Figma it is the "Field Input" component.

Anatomy: a vertical stack of three parts with a 6px gap, in this order: the label on top, the input box in the middle, and the hint below. The box holds the typed value on one line, left-aligned and vertically centered.

Colors, from existing semantic tokens: the box background `--bg-secondary`, the box border a 1px solid `--border-primary`, the label and the value text `--text-primary`, and the hint text `--text-tertiary`.

Typography: the label uses the body font (Poppins) at the `text-sm` size and `text-sm` line height, Medium weight, with letter spacing 0 (the shared field-label style noted under Typography). The value uses the Body Text style (body font, `text-sm`, Regular). The hint uses the body font at the `text-xs` size and `text-xs` line height, Regular (the shared hint style). Each of these stays on one line and is cut with an ellipsis if too long.

Radius: the `medium` role on the box.

Sizing and spacing (temporary raw values, not yet tokens): the box is 40 tall with 12 padding left and right, and the stack uses a 6px gap between the label, the box, and the hint. The field has no fixed width; it fills its container. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

States not yet designed: Figma shows only the filled resting state. There is no focus, hover, disabled, or error style yet. Because the field is typed into, it keeps a visible keyboard focus indicator until Figma defines one; this is tracked in NOTES.md and waits on a design decision. The character limits on the value (Word 50, Definition 350) are behavior from PRD.md FR-3d, not a Figma style.

### Multiline input

The Multiline input is the multi-line version of the Field input, used for the Definition field in the in-page save form and the Management form panel. In Figma it is the "Multiple Line Input" component. It shares the Field input's three-part structure (label, box, hint), its colors, its typography, and its `medium` radius. It differs in three ways: the box is taller to hold several lines, the value text sits at the top of the box instead of vertically centered, and the box has padding on all four sides.

Sizing and spacing (temporary raw values, not yet tokens): the box is 250 tall with 12 padding on all four sides, and the stack uses the same 6px gap between the label, the box, and the hint. The field has no fixed width; it fills its container. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

States not yet designed: the same as the Field input. Figma shows only the filled resting state, with no focus, hover, disabled, or error style yet, and it keeps a visible keyboard focus indicator until Figma defines one; this is tracked in NOTES.md.

### Management form panel

The Management form panel is the right-side panel that holds the Add and Edit form. It replaces the earlier centered modal. In Figma it is the "Dialog" frame. It maps to PRD.md FR-17a, FR-18, FR-18a, and the Management form panel component entry, which own its behavior; this section owns its look. It is a composition of components already specced above, not a new control.

Placement: the panel sits against the right edge of the management view, is full height, and keeps a 16px margin on all four edges. In the mockup its width is 400. It opens over the management view.

Anatomy: a white surface in a vertical stack of three sections with a 32px gap between them, in this order: the header, the form, and the footer.

1. Header: a row with the title on the left and the x-close icon on the right, spread to the full width. The title is "Add Word" in add mode and "Edit Word" in edit mode, in the Section Title style (heading font, `display-xs`). The x-close is a 24 by 24 icon in `--fg-primary`, using the x-close asset.
2. Form: a vertical stack with a 24px gap between fields, in this order: Word (Field input), Definition (Multiline input), Aliases (Field input), and Color (Color picker).
3. Footer: a row with an 8px gap, aligned to the bottom. In edit mode it holds the Save button and the delete button: Save is the Text Button Default variant and stretches to fill the remaining width, and delete is the Icon Button Destructive variant at its fixed 40 by 40 size, placed to the right of Save. In add mode the footer holds only the Save button, which fills the full width, and no delete button.

Colors, from existing semantic tokens: the panel surface is `--bg-primary` (white). The title and the x-close take `--text-primary` and `--fg-primary`. The inner components carry their own tokens from their entries above.

Radius: the `large` role on the panel surface.

Sizing and spacing (temporary raw values, not yet tokens): the panel is 400 wide, with 24 padding left and right and 16 padding top and bottom, a 32px gap between the header, form, and footer, a 24px gap between form fields, and an 8px gap between the footer buttons. The 16px outer margin on all edges is the placement, not padding. These numbers are temporary debt tracked in NOTES.md; replace them with tokens once the spacing and sizing scale is defined in Figma.

States and motion not yet designed: Figma shows the panel as a static frame, so there is no open or close motion (such as a slide-in from the right) defined yet; the build uses a simple, subtle entrance until Figma defines one. Close behavior (X or Escape, no Cancel, no backdrop close) is PRD.md behavior, not a Figma style. These gaps are tracked in NOTES.md.
