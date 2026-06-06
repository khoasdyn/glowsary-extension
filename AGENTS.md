Instructions for AI agents working on this project.

## Before implementing

1. Always read PRD.md first and treat it as the source of truth for what the product should do.
2. Compare the user's request with PRD.md before changing anything. If the request describes a new feature or a change in behavior that is NOT already covered in PRD.md, conflicts with PRD.md, or would make the product behave differently from PRD.md, do not implement it yet. Stop, clearly tell the user what is missing or conflicting, and ask the user to update PRD.md first. Small fixes (typos, bugs, refactors that do not change behavior) do not need this.
3. Inspect the relevant current code before implementing. If PRD.md conflicts with the current state of the codebase, stop and clearly tell the user what the conflict is before making changes.
4. Always create a detailed implementation plan with clear requirements before implementing any change. The plan should state what will change, what will not change, and how the change will be verified.
5. For bug fixes, first restate the bug and the expected behavior in clear language. If the bug report is ambiguous, ask focused clarification questions before fixing it.
6. When editing Markdown documentation, keep each numbered rule, bullet, and short paragraph on one readable line unless a line break is needed for Markdown syntax or readability. Do not hard-wrap sentences in a way that creates awkward paragraph breaks in rendered or plain-text views.

## Design system

7. DESIGN.md is the project's design system. It holds the styling rules for the product: typography now, and spacing, color, and more over time. Treat it as the source of truth for how the product looks.
8. For any design decision or new feature, follow DESIGN.md and use its defined styles. Do not invent new fonts, sizes, colors, or spacing.
9. DESIGN.md is built up day by day and today covers typography only. Areas like spacing and color are not written yet.
10. Never invent a design value that is not in DESIGN.md. If a style you need is missing, do not guess. Keep the current code value, do not add a new one, and clearly flag in your output that DESIGN.md is missing the rule so the user can add it.
11. DESIGN.md is read-only for you. Only Claude maintains it. Never edit DESIGN.md.
12. Figma is the upstream source of the design, and Claude syncs DESIGN.md from Figma. Follow DESIGN.md, not Figma.

## After implementing

13. Update CHANGELOG.md: add a short entry under today's date describing what changed, in plain language. Add new entries on top. Do not rewrite past entries.
14. Give a short commit message for the change (one line, present tense, e.g. "Add definition popup hover trigger").
