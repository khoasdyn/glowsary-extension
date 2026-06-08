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

Opacity and shadows: where a color needs transparency, the code mixes a primitive token with the transparent token to reach the right opacity, instead of writing a raw rgba. Shadows use a dark primitive (currently Slate 900) at low opacity, built the same way, not a separate shadow color token.

The system has two color layers. The first is the primitive layer in `extension/tokens/color-tokens.js` described above. The second is the semantic layer in `extension/tokens/semantic-color-tokens.js`: a file that gives colors a role, such as the main text color or the page background. Each semantic token references a primitive token, never a raw value, so the primitives stay the single source of the actual color.

Semantic tokens use short role names, for example `--text-primary`, `--bg-secondary`, `--fg-error-primary`, and `--border-primary`. They are grouped as Text (text fills), Foreground (icons and graphic marks), Background (surfaces), and Border. The set is small and matches the Figma semantic export exactly. It covers one mode, light, for now; a dark mode would be added later as a second mode.

Adoption note: the semantic layer exists, but the UI still uses primitives directly for now. Switching each screen to the matching semantic role is a separate, later step, done from the Figma screens so each element gets the right role. When that happens, the neutral grays (currently a mix of Slate, Neutral, Gray, and Mist) will settle onto the single Gray family that the semantics use.

Note: a per-word color, a color picker for each saved word in the Add and Edit dialog, is a future feature not yet in PRD.md. Its color rules, including which tokens it may use, must be defined in PRD.md before the feature is built.

## Corner radius

A small scale by role: small for chips, medium for cards, inputs, and list rows, large for the dialog, and full for fully rounded shapes like buttons, the switch, the tab bar, icon buttons, and the color circles.

The fully rounded value in code: in Figma a fully rounded shape is sometimes drawn with 99, 999, or 9999. These all mean the same thing. In code, do not copy those mixed numbers. Use `border-radius: 9999px` for pill shapes and fully rounded rectangles, and `border-radius: 50%` for true circles, where the element has equal width and height.

## Spacing

Not defined yet. To be added.
