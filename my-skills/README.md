# Shared Agent Skills

This folder is the single home for project-local skills used by Codex, Claude, Cursor, and other agents working on Glowsary.

## Discovery

1. Skills live at `my-skills/<skill-name>/SKILL.md`.
2. Agents should read the matching `SKILL.md` before using a named skill, for example `$product-planner`.
3. Agent-facing metadata lives inside the skill folder, usually under `agents/`.
4. Do not create duplicate `.codex/skills` or `.claude/skills` copies unless the user explicitly asks for tool-specific installation.

## Skills

- `product-planner`: Product planning and documentation mode for this project. Use only when explicitly invoked with `$product-planner`.
