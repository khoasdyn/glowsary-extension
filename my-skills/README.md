# Project skills

This folder is the single home for project-local skills used on Glowsary. The project runs on one agent that both plans and builds; read CLAUDE.md for the standing rules.

## Discovery

1. Skills live at `my-skills/<skill-name>/SKILL.md`.
2. Read the matching `SKILL.md` before using a named skill, for example product-planner.

## Skills

- `product-planner`: Product planning and documentation mode for this project. Use only when the user explicitly invokes it by name. Owns PRD, product thinking, critique, and non-design build plans.
- `design-planner`: Figma-to-component design workflow for this project. Use only when the user explicitly invokes it by name. Turns a Figma link for one component into a spec, a token plan, and a build plan that carries the spec inline plus the Figma link. Owns DESIGN.md. The two skills do not overlap.
