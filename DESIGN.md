# Glowsary design system

This file holds the rules and structure of the Glowsary design system. It does not hold the exact values. The exact values for color, typography, radius, and later spacing live in one central place in the code, as design tokens. Figma is the master source those values come from.

This file currently covers typography, color, and corner radius. Spacing and more come later.

## How the design system is organized

The system has three layers, and updates flow in one direction.

1. Figma is the source of truth. The user updates Figma first, so it always holds the latest design.
2. The code holds the central design tokens: the exact values, defined once in one place, used everywhere. This is the precise registry the code reads from.
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

Neutrals: a gray scale plus white, used for text, borders, surfaces, and backgrounds.

Accent families: four families, named Purple, Green, Blue, and Yellow. Purple is the default. Each family uses the same five steps, and each step has a fixed role.

1. Step 50: the lightest tint, the chip background.
2. Step 100: the card background.
3. Step 200: the border or the color-picker circle.
4. Step 800: the definition (body) text.
5. Step 900: the title text.

Destructive: a red family, used for delete and other destructive actions.

Shadow colors: black at low opacity, used inside the skeuomorphic shadow effect on switches and inputs.

Note: the four accent families exist to support a per-word color, the color picker in the Add and Edit dialog. That feature is not in PRD.md yet. The color tokens may exist, but the rules for how the per-word color behaves must be defined in PRD.md before the feature is built.

## Corner radius

A small scale by role: small for chips, medium for cards, inputs, and list rows, large for the dialog, and full for fully rounded shapes like buttons, the switch, the tab bar, icon buttons, and the color circles.

The fully rounded value in code: in Figma a fully rounded shape is sometimes drawn with 99, 999, or 9999. These all mean the same thing. In code, do not copy those mixed numbers. Use `border-radius: 9999px` for pill shapes and fully rounded rectangles, and `border-radius: 50%` for true circles, where the element has equal width and height.

## Spacing

Not defined yet. To be added.
