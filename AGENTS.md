Instructions for AI agents working on this project.

## Before implementing

1. Always read PRD.md first and treat it as the source of truth for what the product should do.
2. Compare the user's request with PRD.md before changing anything. If the request describes a new feature or a change in behavior that is NOT already covered in PRD.md, conflicts with PRD.md, or would make the product behave differently from PRD.md, do not implement it yet. Stop, clearly tell the user what is missing or conflicting, and ask the user to update PRD.md first. Small fixes (typos, bugs, refactors that do not change behavior) do not need this.
3. Inspect the relevant current code before implementing. If PRD.md conflicts with the current state of the codebase, stop and clearly tell the user what the conflict is before making changes.
4. Always create a detailed implementation plan with clear requirements before implementing any change. The plan should state what will change, what will not change, and how the change will be verified.
5. For bug fixes, first restate the bug and the expected behavior in clear language. If the bug report is ambiguous, ask focused clarification questions before fixing it.
6. When editing Markdown documentation, keep each numbered rule, bullet, and short paragraph on one readable line unless a line break is needed for Markdown syntax or readability. Do not hard-wrap sentences in a way that creates awkward paragraph breaks in rendered or plain-text views.

## Shared skills

6a. Project-local skills are centralized in `my-skills`.
6b. Before using a named skill, look for `my-skills/<skill-name>/SKILL.md`, read that file, and follow it as the source of truth for the skill. If the skill has an `agents/` folder, read the metadata there for agent-facing names, prompts, and invocation policy.
6c. Skills in `my-skills` are shared across Codex, Claude, Cursor, and any other agent working in this repo. If an agent cannot automatically load this folder, it should still discover the skill through this section and read the matching `SKILL.md` manually.

## Design system

7. The codebase has one central place that defines all design tokens: the exact values for color, typography, radius, and later spacing. These tokens are the single source of design values for the code.
8. For any design decision or new feature, use the existing tokens. Never hardcode a raw value, such as a hex color or a pixel size, in a component. Always reference the central token.
8a. All token files live in the `extension/tokens` folder, one file per category and layer. A category always has a primitive file; it has a semantic file only when the design defines semantic tokens for it. Never hardcode a raw value; always reference a token.
8b. Color has two layers. Primitives live in `extension/tokens/color-tokens.js` (the raw palette, names `--color-{family}-{step}`, for example `--color-slate-700`). Semantic role tokens live in `extension/tokens/semantic-color-tokens.js` with short role names like `--text-primary`, `--bg-secondary`, and `--border-primary`, and each one references a primitive token, never a raw value. Never write a raw color value (hex, rgb, rgba, or a named color) anywhere else in the code. When you set a color in the UI, use a semantic role token where one fits the role, and use a primitive only when no role token covers the case.
8c. Typography also comes from tokens: font size (`--font-size-{step}`), line height (`--line-height-{step}`), font family, and font weight, from the Figma type scale. Use the named text styles (Page Title, Section Title, Card Title, Subtitle Page, Body Text) for headings and body, and use the size and line-height tokens directly for smaller UI text like labels, buttons, and hints. Never write a raw font size or line height. Only the shipped font weights may be used: Regular, Medium, and SemiBold. Do not use Bold or any italic style; there is no font file for them yet.
9. DESIGN.md holds the rules and structure of the design system: token names, roles, and conventions. Read it for how to use the tokens. It does not hold the exact values.
10. When the plan refers to a design token that does not exist yet in the code, add that token to the central tokens using the value the plan gives, note it in your output and in CHANGELOG.md, flag it clearly for the user, and keep building normally. If the plan does not give a value for that token, do not invent one: flag it, keep the current code value in that spot, and continue. Never invent a design value on your own.
11. DESIGN.md is read-only for you. The design-planner skill maintains it. Never edit it, and never change a token value on your own. Change tokens only when a plan from the user gives you the new values.
12. Figma is the upstream source of the design. The design-planner skill reads Figma and writes the component's visual spec into the build plan, together with the Figma link. You build from the plan and the tokens, and you open the Figma link the plan gives you when you need more visual detail. Follow the tokens and DESIGN.md for design-system values, and follow the build plan and its Figma link for the component spec.
12a. Component styles come from the build plan and Figma, not a documentation file. The build plan carries the component's visual spec read from Figma and includes the Figma link. When you build or change a component, match the spec in the plan and reference the tokens it names (the tokens live in DESIGN.md). Do not invent a component style that is not in the plan or in Figma; if the spec is missing or unclear, stop and tell the user so the design-planner skill adds it from Figma first. Open the Figma link in the plan for the complete detail (colors, typography, radius, sizing, and states) before building.
12b. There is no standing mismatch log and no standing design-debt store. Open gaps and known debts live where they belong: behavior in PRD.md, and design debt and pending fixes in the build plan the user hands you. Read those for context on what is unresolved, so you do not build on top of an open gap.

## After implementing

13. Update CHANGELOG.md: add a short entry under today's date describing what changed, in plain language. Add new entries on top. Do not rewrite past entries.
14. Give a short commit message for the change (one line, present tense, e.g. "Add definition popup hover trigger").
