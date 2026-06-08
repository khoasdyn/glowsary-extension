# Glowsary design system

This file holds the rules and structure of the Glowsary design system. It does not hold the exact values. The exact values for color, typography, radius, and later spacing live in one central place in the code, as design tokens. Figma is the master source those values come from.

This file currently covers typography, color, and corner radius. Spacing and more come later.

## How the design system is organized

The system has three layers, and updates flow in one direction.

1. Figma is the source of truth. The user updates Figma first, so it always holds the latest design.
2. The code holds the central design tokens: the exact values, defined once in one place, used everywhere. This is the precise registry the code reads from. For color, that one place is the file `extension/color-tokens.js`, generated from the Figma color export.
3. This file holds the rules and structure: what tokens exist, how they are named, what each is for, and what agents may and may not do. It does not repeat the exact values.

Sync rule: when the user shares a Figma link or asks for a check, Claude reads Figma, hands the updated values to Codex through a plan so Codex updates the central tokens, and keeps this file's rules in step. If Figma and the code tokens ever disagree, Figma is right.

## Rules for agents

1. Use only the tokens that already exist. Do not invent new colors, sizes, radii, or spacing.
2. Never hardcode a raw value, such as a hex color or a pixel size, inside a component. Always reference the central token.
3. If a value you need does not exist as a token, do not guess. Stop and tell the user, so the user adds it in Figma first and Claude adds the token.
4. Token names match across Figma, this file, and the code, so there is no guessing.
5. Only Claude maintains this file. Codex reads the tokens and this file, and never edits this file.

## Typography

Two font families: Copse is the heading font, a serif, used for display and headings. Poppins is the body font, used for body text and all UI components.

Important: Copse ships only a Regular weight. Every Copse style renders at weight 400, even when its name says "Semibold" or "Medium". Heading strength comes from size, not from bold weight. The design uses three font files only: Copse Regular, Poppins Regular, and Poppins Medium.

The named text styles and what each is for:

1. Page Title (Copse): the main page title.
2. Section Title (Copse): section headings and dialog titles.
3. Card Title (Copse): the saved word shown on a card.
4. Subtitle Page (Poppins, regular): the subtitle line under a page title.
5. Text md / Medium (Poppins, medium): larger emphasis text.
6. Text sm / Medium (Poppins, medium): field labels and button text.
7. Text sm / Regular (Poppins, regular): body text, definitions, and input values.
8. Text xs / Regular (Poppins, regular): hints and helper text.

Notes: alias chips use Copse Regular at the smallest text size. Every custom font keeps the system font stack as a fallback, so text still shows if a font fails to load.

## Color

All color comes from one file, `extension/color-tokens.js`. This file is the single source of color for the whole extension. It is generated from the Figma color export, so Figma stays the upstream source. The file holds the full primitive color library: every color family and every step from Figma (steps 50 to 950), plus Base white, black, and transparent, and a Neutral alpha set. The values match Figma exactly.

Token names follow one pattern: `--color-{family}-{step}`, for example `--color-slate-700` or `--color-emerald-600`. The family and step names match the Figma names, so any token traces straight back to its Figma variable. The file exposes these tokens as CSS variables for the UI, and also as plain values for code that runs without CSS, such as the service worker that sets the toolbar badge color.

Rule for all color: the UI never uses a raw color value (no hex, rgb, rgba, or named color). Every color references a token from this file. The only place raw color values live is this one file.

Opacity and shadows: where a color needs transparency, the code mixes a primitive token with the transparent token to reach the right opacity, instead of writing a raw rgba. Shadows use a dark primitive (currently Slate 900) at low opacity, built the same way, not a separate shadow color token.

The system has two color layers. The first is the primitive layer in `extension/color-tokens.js` described above. The second is the semantic layer: a separate file that gives colors a role, such as the main text color or the page background. Each semantic token references a primitive token, never a raw value, so the primitives stay the single source of the actual color.

Semantic tokens use short role names, for example `--text-primary`, `--bg-secondary`, `--fg-error-primary`, and `--border-primary`. They are grouped as Text (text fills), Foreground (icons and graphic marks), Background (surfaces), and Border. The set is small and matches the Figma semantic export exactly. It covers one mode, light, for now; a dark mode would be added later as a second mode.

Adoption note: the semantic layer exists, but the UI still uses primitives directly for now. Switching each screen to the matching semantic role is a separate, later step, done from the Figma screens so each element gets the right role. When that happens, the neutral grays (currently a mix of Slate, Neutral, Gray, and Mist) will settle onto the single Gray family that the semantics use.

Note: a per-word color, a color picker for each saved word in the Add and Edit dialog, is a future feature not yet in PRD.md. Its color rules, including which tokens it may use, must be defined in PRD.md before the feature is built.

## Corner radius

A small scale by role: small for chips, medium for cards, inputs, and list rows, large for the dialog, and full for fully rounded shapes like buttons, the switch, the tab bar, icon buttons, and the color circles.

The fully rounded value in code: in Figma a fully rounded shape is sometimes drawn with 99, 999, or 9999. These all mean the same thing. In code, do not copy those mixed numbers. Use `border-radius: 9999px` for pill shapes and fully rounded rectangles, and `border-radius: 50%` for true circles, where the element has equal width and height.

## Spacing

Not defined yet. To be added.
