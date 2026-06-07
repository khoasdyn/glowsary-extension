Instructions for AI agents working on this project.

## Before implementing

1. Always read PRD.md first and treat it as the source of truth for what the product should do.
2. Compare the user's request with PRD.md before changing anything. If the request describes a new feature or a change in behavior that is NOT already covered in PRD.md, conflicts with PRD.md, or would make the product behave differently from PRD.md, do not implement it yet. Stop, clearly tell the user what is missing or conflicting, and ask the user to update PRD.md first. Small fixes (typos, bugs, refactors that do not change behavior) do not need this.
3. Inspect the relevant current code before implementing. If PRD.md conflicts with the current state of the codebase, stop and clearly tell the user what the conflict is before making changes.
4. Always create a detailed implementation plan with clear requirements before implementing any change. The plan should state what will change, what will not change, and how the change will be verified.
5. For bug fixes, first restate the bug and the expected behavior in clear language. If the bug report is ambiguous, ask focused clarification questions before fixing it.
6. When editing Markdown documentation, keep each numbered rule, bullet, and short paragraph on one readable line unless a line break is needed for Markdown syntax or readability. Do not hard-wrap sentences in a way that creates awkward paragraph breaks in rendered or plain-text views.

## Design system

7. The codebase has one central place that defines all design tokens: the exact values for color, typography, radius, and later spacing. These tokens are the single source of design values for the code.
8. For any design decision or new feature, use the existing tokens. Never hardcode a raw value, such as a hex color or a pixel size, in a component. Always reference the central token.
8a. For color, the single source is the file `extension/color-tokens.js`. Use only its tokens, named `--color-{family}-{step}` (for example `--color-slate-700`). Never write a raw color value (hex, rgb, rgba, or a named color) anywhere else in the code; the only place raw color values live is that one file.
9. DESIGN.md holds the rules and structure of the design system: token names, roles, and conventions. Read it for how to use the tokens. It does not hold the exact values.
10. When the plan refers to a design token that does not exist yet in the code, add that token to the central tokens using the value the plan gives, note it in your output and in CHANGELOG.md, flag it clearly for the user, and keep building normally. If the plan does not give a value for that token, do not invent one: flag it, keep the current code value in that spot, and continue. Never invent a design value on your own.
11. DESIGN.md is read-only for you. Only Claude maintains it. Never edit DESIGN.md, and never change a token value on your own. Change tokens only when a plan from the user gives you the new values.
12. Figma is the upstream source of the design. Normally you build only from the plan and the tokens, and you do not open Figma. Claude reads Figma and passes new token values to you through a plan. You may read a Figma link only when the user includes the link in the prompt, usually for a complex visual. Follow the tokens and DESIGN.md, not Figma directly, unless the prompt gives you a Figma link.

## After implementing

13. Update CHANGELOG.md: add a short entry under today's date describing what changed, in plain language. Add new entries on top. Do not rewrite past entries.
14. Give a short commit message for the change (one line, present tense, e.g. "Add definition popup hover trigger").
