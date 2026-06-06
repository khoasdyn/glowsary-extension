# Glowsary design system

This file is the design reference for Glowsary. It records the visual rules so the product stays consistent. It currently covers typography only. Color, spacing, and components will be added later.

Figma is the source of truth for the design. The user updates Figma first, so it always holds the latest design. This document is the written contract that agents build against, because the code follows DESIGN.md, not Figma directly. Claude keeps DESIGN.md in sync with Figma whenever the user shares a Figma mockup link or asks for a check, so DESIGN.md always takes its values from Figma. If DESIGN.md and Figma ever disagree, Figma is right and DESIGN.md must be updated to match.

## Typography

### Fonts

1. Heading font: Copse, a serif. Used for display text and headings.
2. Body font: Poppins, a sans-serif. Used for body text and all UI components.
3. Important: Copse ships only a Regular weight. Every Copse style renders at weight 400, even when its style name says "Semibold" or "Medium". Heading strength comes from size, not from bold weight. Do not expect a bold Copse, because it does not exist.
4. The design uses three font files only: Copse Regular, Poppins Regular (400), and Poppins Medium (500). No other weights or italics are used.
5. Font files live in `extension/fonts`. Keep the `OFL.txt` license file in each font folder, because the Open Font License requires it.

### Size scale

The whole type system is built on six size tokens. Each token has a fixed size and line height, written here as size / line height in pixels.

| Token | Size / line height |
|---|---|
| display-md | 36 / 44 |
| display-xs | 24 / 32 |
| text-xl | 20 / 30 |
| text-md | 16 / 24 |
| text-sm | 14 / 20 |
| text-xs | 12 / 18 |

### Text styles

These are the named styles used across the product. Size and line height are in pixels.

| Style | Font | Size / line height | Weight | Used for |
|---|---|---|---|---|
| Page Title | Copse | 36 / 44 | 400 | The main page title, for example "Welcome to Glowsary!" |
| Section Title | Copse | 24 / 32 | 400 | Section headings and dialog titles, for example "Add New Word" and "Edit Word" |
| Card Title | Copse | 20 / 30 | 400 | The saved word (term) shown on a card |
| Subtitle Page | Poppins | 16 / 24 | 400 | The subtitle line under a page title |
| Text md / Medium | Poppins | 16 / 24 | 500 | Larger emphasis text |
| Text sm / Medium | Poppins | 14 / 20 | 500 | Field labels and button text |
| Text sm / Regular | Poppins | 14 / 20 | 400 | Body text, definitions, and input values |
| Text xs / Regular | Poppins | 12 / 18 | 400 | Hints and helper text, for example "Maximum 50 characters" |

### Other typography notes

1. Alias chips use Copse Regular at 12 / 18, not Poppins.
2. Each custom font must always have the system font stack as a fallback, so text still shows if a font fails to load.
