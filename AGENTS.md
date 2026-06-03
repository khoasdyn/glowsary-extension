Instructions for AI agents working on this project.

## Before implementing

1. Always read PRD.md first and treat it as the source of truth for what the product should do.
2. Compare my request with PRD.md before changing anything. If my request describes a new feature or a change in behavior that is NOT already covered in PRD.md, conflicts with PRD.md, or would make the product behave differently from PRD.md, do not implement it yet. Stop, clearly tell me what is missing or conflicting, and ask me to update PRD.md first. Small fixes (typos, bugs, refactors that do not change behavior) do not need this.
3. Inspect the relevant current code before implementing. If PRD.md conflicts with the current state of the codebase, stop and clearly tell me what the conflict is before making changes.
4. Always create a detailed implementation plan with clear requirements before implementing any change. The plan should state what will change, what will not change, and how the change will be verified.
5. For bug fixes, first restate the bug and the expected behavior in clear language. If the bug report is ambiguous, ask focused clarification questions before fixing it.
6. When editing Markdown documentation, keep each numbered rule, bullet, and short paragraph on one readable line unless a line break is needed for Markdown syntax or readability. Do not hard-wrap sentences in a way that creates awkward paragraph breaks in rendered or plain-text views.

## After implementing

7. Update CHANGELOG.md: add a short entry under today's date describing what changed, in plain language. Add new entries on top. Do not rewrite past entries.
8. Give me a short commit message for the change (one line, present tense, e.g. "Add definition popup hover trigger").
