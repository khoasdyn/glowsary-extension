# Shared Agent Skills

This folder is the single home for project-local skills used by Codex, Claude, Cursor, and other agents working on Glowsary.

## Discovery

1. Skills live at `my-skills/<skill-name>/SKILL.md`.
2. Agents should read the matching `SKILL.md` before using a named skill, for example product-planner.
3. Agent-facing metadata lives inside the skill folder, usually under `agents/`.

## Skills

- `product-planner`: Product planning and documentation mode for this project. Use only when the user explicitly invokes it by name. Owns PRD, product thinking, critique, and non-design build plans.
- `design-planner`: Figma-to-component design workflow for this project. Use only when the user explicitly invokes it by name. Turns a Figma link for one component into a spec, a token plan, DESIGN.md documentation, and a build plan. Owns DESIGN.md. The two skills do not overlap.
