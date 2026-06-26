# Glowsary design system

This file holds the rules and structure of the Glowsary design system. It does not hold the exact values. The exact values for color, typography, radius, and later spacing live in one central place in the code, as design tokens. Figma is the master source those values come from.

This file currently covers typography, color, corner radius, shadows, and spacing. More come later.

## How the design system is organized

The system has three layers, and updates flow in one direction.

1. Figma is the source of truth. The user updates Figma first, so it always holds the latest design.
2. The code holds the central design tokens: the exact values, defined once in one place, used everywhere. This is the precise registry the code reads from.
2a. All token files live together in one folder, `extension/tokens`. Each token category has its own file inside that folder, for example `tokens/color-tokens.js` for the color primitives and `tokens/semantic-color-tokens.js` for the color roles. Typography goes there next, and spacing and radius follow as they are added. The files sit side by side, but each stays separate, so one Figma export maps to one file.
2b. Layers per category: a category always has a primitive file, and it has a second semantic file only when the design actually defines semantic tokens for it. Color has both. Typography has a primitive scale plus the named text styles, which act as its semantic layer. Spacing and radius are expected to have only a primitive scale for now. Never invent a semantic layer the design does not have.
3. This file holds the rules and structure: what tokens exist, how they are named, what each is for, and what agents may and may not do. It does not repeat the exact values.

Sync rule: when the user shares a Figma link or asks for a check, Claude reads Figma and puts the updated values into a plan; after the user pastes the plan back, the build updates the central tokens, and this file's rules are kept in step. If Figma and the code tokens ever disagree, Figma is right.

## Rules for agents

1. Use only the tokens that already exist. Do not invent new colors, sizes, radii, or spacing.
2. Never hardcode a raw value, such as a hex color or a pixel size, inside a component. Always reference the central token.
3. If a value you need does not exist as a token, do not guess. Stop and tell the user, so the user adds it in Figma first and Claude adds the token.
4. Token names match across Figma, this file, and the code, so there is no guessing.
5. This file changes only through an approved, pasted-back plan. Outside that, the tokens and this file are read-only and never edited.
6. Component styles come from Figma and the build plan, not this file. The build plan carries the component's visual spec read from Figma, and that spec references the tokens defined here. When you build or change a component, match the spec in the plan. Do not invent a component style that is not in the plan or in Figma; if one is missing or unclear, stop and tell the user so it is read from Figma into a plan first.

## Typography

Two font families: Copse is the heading font, a serif, used for titles. Google Sans Flex is the body font, used for body text and all UI controls; it is chosen for its full Vietnamese coverage.

The exact type values live as tokens, generated from the Figma type scale. There are four token groups: font size (named `--font-size-{step}`, with steps `text-xs` through `display-2xl`), line height (named `--line-height-{step}`, with the same steps), font family, and font weight. The code references these tokens and never writes a raw size or line height.

Font files that ship: Copse Regular (400), and Google Sans Flex Regular (400), Medium (500), and SemiBold (600) at the 24pt optical size. Only these three static Google Sans Flex files ship; the variable font and every other optical-size bucket are not included. Bold (700) and all italic styles exist as tokens in Figma but have no font file, so the UI must not use them yet. Copse ships only Regular, so every title renders at weight 400; heading strength comes from size, not from bold weight.

Named text styles, taken from Figma. Each one is a font family, a weight, a size token, and the matching line height token:

1. Page Title: heading font, regular, the `display-md` size and line height. The main page title.
2. Section Title: heading font, regular, the `display-xs` size and line height. Section headings and dialog titles.
3. Card Title: heading font, regular, the `text-lg` size and line height. The saved word shown on a card.
4. Subtitle Page: body font, regular, the `text-md` size and line height. The subtitle line under a page title.
5. Body Text: body font, regular, the `text-sm` size and line height. Body text, input values, and list text.
6. Word Definition: body font, regular, the `text-sm` size and line height. The definition sentence in the in-page popup and on a word card. It shares Body Text's values but is its own named style, so definition text can change on its own later.

Text that is not a named style uses the scale tokens directly: field labels and button text use the body font at the `text-sm` size with medium weight; hints and helper text use the body font at the `text-xs` size; alias chips use the heading font at the `text-xs` size. These may become named styles later if Figma adds them.

Notes: every custom font keeps the system font stack as a fallback, so text still shows if a font fails to load. The in-page content UI uses its own prefixed font names so it does not clash with the host page's fonts.

## Color

All color comes from one file, `extension/tokens/color-tokens.js`. This file is the single source of color for the whole extension. It is generated from the Figma color export, so Figma stays the upstream source. The file holds the full primitive color library: every color family and every step from Figma (steps 50 to 950), plus Base white, black, and transparent, and a Neutral alpha set. The values match Figma exactly.

Token names follow one pattern: `--color-{family}-{step}`, for example `--color-slate-700` or `--color-emerald-600`. The family and step names match the Figma names, so any token traces straight back to its Figma variable. The file exposes these tokens as CSS variables for the UI, and also as plain values for code that runs without CSS, such as the service worker that sets the toolbar badge color.

Rule for all color: the UI never uses a raw color value (no hex, rgb, rgba, or named color). Every color references a token from this file. The only place raw color values live is this one file.

The system has two color layers. The first is the primitive layer in `extension/tokens/color-tokens.js` described above. The second is the semantic layer in `extension/tokens/semantic-color-tokens.js`: a file that gives colors a role, such as the main text color or the page background. Each semantic token references a primitive token, never a raw value, so the primitives stay the single source of the actual color.

Semantic tokens use short role names, for example `--text-primary`, `--bg-secondary`, `--fg-error-primary`, and `--border-primary`. They are grouped as Text (text fills), Foreground (icons and graphic marks), Background (surfaces), and Border. The set is small and matches the Figma semantic export exactly. It covers one mode, light, for now; a dark mode would be added later as a second mode.

Three of these roles are defined but not yet adopted by the UI: `--text-placeholder` (Gray/400), the placeholder text color; `--fg-quaternary` (Gray/500), a muted foreground for icons and marks; and `--border-primary_focus` (Gray/900), the border color for a focused input. The last keeps Figma's exact name, including the underscore before the `_focus` state, so it traces straight back to its Figma variable. They emit as CSS variables now, but switching elements to use them is a separate, later step, the same as the rest of the semantic layer.

Adoption note: the semantic layer exists, but the UI still uses primitives directly for now. Switching each screen to the matching semantic role is a separate, later step, done from the Figma screens so each element gets the right role. When that happens, the neutral grays (currently a mix of Slate, Neutral, Gray, and Mist) will settle onto the single Gray family that the semantics use.

Word Card color modes: `semantic-color-tokens.js` also holds a Word Card token group alongside the base semantic tokens. This group is mode-switched: it has five modes — Add New, Purple, Yellow, Green, and Blue — so each word card can render with surfaces, borders, and text tinted to its assigned color. The Add New mode is the neutral gray default (matching existing gray primitives), used when no color has been assigned. The other four modes match the four color picker choices.

The Word Card tokens use the `--wc-` prefix to keep them separate from the base semantic tokens. Five tint the card and popup surfaces, and three tint the on-page highlight on a saved word:
- `--wc-bg-alias-chip`: background of the alias chip inside the card.
- `--wc-bg-card`: card surface background.
- `--wc-border`: card border color.
- `--wc-subtext`: definition and secondary text color.
- `--wc-word-text`: word title text color, also the word's text color while its highlight is active (FR-9b).
- `--wc-underline-default`: the on-page highlight's dashed underline color at rest (FR-9).
- `--wc-underline-hover`: the underline color while the word's highlight is active (FR-9b).
- `--wc-underline-hover-fill`: the soft background fill painted behind the word while its highlight is active (FR-9b). Defined for the four color modes only; the Add New gray mode has no fill, since saved entries always carry one of the four colors.

When a word card renders, it scopes these tokens to the card element using the mode that matches the entry's color value. The base semantic tokens (Text, Foreground, Background, Border) are the same across all five modes; only the Word Card group changes per mode.

Note: the Color picker circles (the selector UI) now also use Word Card tokens — each circle is scoped to its color mode and uses `--wc-bg-card` and `--wc-border` for its surface, with `--wc-subtext` for the check mark. The Word Card tokens are used both for the picker circles and for the actual word cards in the grid and hover popup.

## Corner radius

The exact values live as tokens in `extension/tokens/radius-tokens.js`, generated from the Figma radius export. The CSS variable names come directly from the Figma variable names:

- `--cta`: 9999px. The fully rounded value for buttons, the switch track, the Tab nav track and items, icon buttons, and color circles. In code use `9999px` for pill shapes and fully rounded rectangles, and `50%` for true circles where the element has equal width and height.
- `--box`: 12px. For inputs, list rows, and general box elements.
- `--card-sm`: 4px. Used for alias chips and small card elements.
- `--card-md`: 12px. For the highlight popup, the word cards, and medium-radius card elements.
- `--card-lg`: 24px. For dialogs and panels that need the larger rounded look.

The component specs in the build plans use these token names.

## Shadows

Shadows are the first effect category. Like color and typography, the exact values come from Figma and live as central tokens in the code, in their own file `extension/tokens/shadow-tokens.js`, generated from the Figma effect export. The code references these tokens and never writes a raw shadow value.

Figma defines shadows in two parts: a few shadow effect colors, and one composite effect style built from them.

Shadow effect colors: these are Base black at low opacity, matching the Figma effect color variables one to one. Each one references the `--color-base-black` primitive and applies the opacity from Figma, so no raw color lives outside `color-tokens.js`. There are three: `--shadow-xs` (black at 5%), `--shadow-skeumorphic-inner` (black at 5%), and `--shadow-skeumorphic-inner-border` (black at 18%). The names keep Figma's spelling, including "skeumorphic", so each token traces straight back to its Figma variable.

Composite effect style: `--shadow-xs-skeuomorphic` is the named shadow style, the same idea as a named text style in Typography. It stacks three layers, in this order, using the effect colors above: an outer drop shadow in `--shadow-xs`, offset 0 down 1, blur 2, spread 0; an inner shadow in `--shadow-skeumorphic-inner`, offset 0 up 2, blur 0, spread 0; and an inner shadow in `--shadow-skeumorphic-inner-border`, offset 0, blur 0, spread 1. This is the soft, raised, skeuomorphic look used by the switch knob.

This is a brand new category, so the section names the layer offsets, blur, and spread from Figma directly, so an agent can build the token without guessing. The opacity values (5% and 18%) are the Figma effect color values, not a value mixed from any gray family.

## Icons

Icons are SVG assets in one folder, `extension/assets`, one file per icon, named for the icon, for example `trash-03.svg` and `settings-02.svg`. Agents take icons from this folder. The names match the Figma icon names so each file traces back to its source.

A Figma icon export cannot link to a color token, so each SVG ships with a fixed color from Figma. That color in the file is only a placeholder; the icon does not get its final color from the file. Where the icon is used, it takes the color of its context, so the foreground token of the Icon Button variant or the Text Button drives it. Applying that color is done at the point of use, not in the asset.

The Icon Button uses an 18 by 18 icon slot. The Text Button trailing icon uses a 20 by 20 slot, matching Figma. An icon drawn at another size is scaled to fit its slot.

## Spacing

The exact values live as tokens in `extension/tokens/spacing-tokens.js`, generated from the Figma spacing export. Spacing is primitive-only: Figma defines a single scale of gap values with no semantic layer, so there is no second file. The CSS variable names come directly from the Figma variable names, with no category prefix, the same convention as radius. All four are gaps, used for the space between elements in an auto-layout, and carry pixel values:

- `--section-gap`: 64px. The gap between major sections of a page.
- `--field-gap`: 24px. The gap between form fields.
- `--label-field`: 6px. The gap between a field label and its input. The name keeps Figma's exact spelling, which does not end in `-gap` like the others.
- `--button-gap`: 8px. The gap between buttons in a row, and between a button's text and its icon.

These tokens are defined and emit as CSS variables now, but the UI does not use them yet; adopting them into layouts is a separate, later step done from the Figma screens.

## Components

Component visual specs live in Figma, not in a documentation file. When a component is built or changed, Claude reads its spec from Figma and writes it into the build plan, which references the token names defined here. DESIGN.md (this file) keeps the design system, the tokens and the rules, and changes only through an approved plan.
