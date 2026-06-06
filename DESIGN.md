# Glowsary Design System

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

## Color

Colors are named as a family plus a step number, for example Gray / 600. A higher step number is darker. The system has four groups: neutrals, four accent families, a destructive red, and shadow colors.

### Neutrals

Neutrals are used for text, borders, surfaces, and backgrounds.

| Token | Hex |
|---|---|
| Base / white | #ffffff |
| Gray / 50 | #f9fafb |
| Gray / 100 | #f3f4f6 |
| Gray / 200 | #e5e7eb |
| Gray / 300 | #d1d5db |
| Gray / 600 | #4b5563 |
| Gray / 700 | #374151 |
| Gray / 800 | #1f2937 |
| Gray / 900 | #111827 |

### Accent families

There are four accent families: Purple, Green, Blue, and Yellow. Purple is the default. Each family uses the same five steps, and each step has a fixed role taken from the word card design.

1. Step 50: the lightest tint, used for the chip background.
2. Step 100: the card background.
3. Step 200: the border or the color-picker circle.
4. Step 800: the definition (body) text.
5. Step 900: the title text.

Purple:

| Token | Hex |
|---|---|
| Purple / 50 | #faf5ff |
| Purple / 100 | #f3e8ff |
| Purple / 200 | #e9d5ff |
| Purple / 800 | #6b21a8 |
| Purple / 900 | #581c87 |

Green:

| Token | Hex |
|---|---|
| Green / 50 | #f0fdf4 |
| Green / 100 | #dcfce7 |
| Green / 200 | #bbf7d0 |
| Green / 800 | #166534 |
| Green / 900 | #14532d |

Blue:

| Token | Hex |
|---|---|
| Blue / 50 | #eff6ff |
| Blue / 100 | #dbeafe |
| Blue / 200 | #bfdbfe |
| Blue / 800 | #1e40af |
| Blue / 900 | #1e3a8a |

Yellow:

| Token | Hex |
|---|---|
| Yellow / 50 | #fefce8 |
| Yellow / 100 | #fef9c3 |
| Yellow / 200 | #fef08a |
| Yellow / 800 | #854d0e |
| Yellow / 900 | #713f12 |

Note: the four accent families exist to support a per-word color (the color picker in the Add and Edit dialog). That feature is not in PRD.md yet. These colors are recorded here as a reference, but the rules for how the per-word color behaves must be defined in PRD.md before the feature is built.

### Destructive (red)

Red is used for delete and other destructive actions.

| Token | Hex |
|---|---|
| Red / 50 | #fef2f2 |
| Red / 600 | #dc2626 |
| Red / 700 | #b91c1c |

### Shadow colors

These are not palette colors. They are black at low opacity, used inside the skeuomorphic shadow effect on switches and inputs.

| Token | Hex (with alpha) |
|---|---|
| shadow-xs | #0000000d (black 5%) |
| shadow-skeumorphic-inner | #0000000d (black 5%) |
| shadow-skeumorphic-inner-border | #0000002e (black 18%) |

## Corner radius

Corner radius uses a small scale of fixed values, plus one fully rounded option. Name each by its role.

| Token | Value | Used for |
|---|---|---|
| radius-sm | 4px | Alias chips |
| radius-md | 12px | Cards, input boxes, multi-line inputs, list rows |
| radius-lg | 24px | The dialog |
| radius-full | fully rounded | Buttons, the switch track, the tab bar, icon buttons, color-picker circles |

### The fully rounded value in code

In Figma, a fully rounded shape is sometimes drawn with 99, 999, or 9999. These all mean the same thing: round the corners completely. In code, do not copy those mixed numbers. Use one consistent rule instead.

1. For pill shapes and fully rounded rectangles, like buttons, the switch track, and the tab bar, use `border-radius: 9999px`.
2. For perfect circles, where the element has equal width and height, like icon buttons, the switch knob, and the color-picker circles, use `border-radius: 50%`.

This keeps the code clean and avoids the random mix of 99, 999, and 9999.
