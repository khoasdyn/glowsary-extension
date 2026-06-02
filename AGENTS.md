Instructions for AI agents working on this project.

## Before implementing

1. Always read PRD.md first and treat it as the source of truth for what the
   product should do.
2. If my request describes a new feature or a change in behavior that is NOT
   already covered in PRD.md, do not implement it yet. Stop and tell me it is
   missing from the PRD, and ask me to add it there first. Small fixes (typos,
   bugs, refactors that do not change behavior) do not need this.

## After implementing

3. Update CHANGELOG.md: add a short entry under today's date describing what
   changed, in plain language. Add new entries on top. Do not rewrite past
   entries.
4. Give me a short commit message for the change (one line, present tense,
   e.g. "Add definition popup hover trigger").
