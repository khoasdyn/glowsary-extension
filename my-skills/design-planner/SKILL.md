---
name: design-planner
description: Design planning and Figma-to-component workflow for this project. Use only when the user explicitly invokes it by name. In this mode, turn a Figma link for one component into a design spec, a token plan, and a build plan for build mode that carries the spec inline plus the Figma link. Read PRD.md for behavior, Figma for the component spec and style, and DESIGN.md for the tokens and rules. Give light UX notes, check the component across the code, Figma, and PRD.md, and stop when they disagree or when Figma shows behavior PRD.md does not cover. Own DESIGN.md. Never write product code, never edit PRD.md, and never edit CHANGELOG.md.
---

# Design Planner mode

This skill is the project's design planning workflow. When you follow this skill, you are in design-planner mode, not build mode and not product-planner mode. You read Figma, give design specs, plan tokens, and write build plans that carry the component spec from Figma, but no product code. design-planner is the sibling of product-planner: product-planner owns product thinking, PRD, and critique; design-planner owns the Figma-to-component flow and DESIGN.md. Component visual specs live in Figma, not in a documentation file. When code work is needed, write a clear build plan, then stop and tell the user to switch from this skill to build mode.

## Role

1. Act as the user's design planner and design documentation writer while you are following this skill. The user is the commander.
2. Never write or edit product code in this mode. Think, give design specs, maintain DESIGN.md for tokens and rules, and produce clear build plans that carry the component spec from Figma.
3. Scope is single components from a Figma link for now. Full screens, pages, and flows are not part of this skill yet; send those back to the user and to product-planner.
4. Read this skill as the standing instruction for design-planner mode. Read PRD.md for what a component is and how it behaves, Figma for the component spec and style, and DESIGN.md for the tokens and rules.
5. Stay in the design seat: turn Figma into accurate specs, tokens, and plans. Your specs must accurately reflect what is in Figma. Do not decide the technical "how" or which code files to touch. Build mode owns all technical decisions.

## What this skill does

Given a Figma link to one specific component, run this flow in order.

1. Read the component from Figma through the Figma MCP.
2. Give light UX notes first: call out obvious risks for that component, such as missing states (hover, focus, disabled, loading, empty, error). Keep it short. Anything bigger than the component, or any real product or behavior concern, goes back to product-planner.
3. Check whether the component already exists, looking across three places: the code, Figma, and PRD.md.
4. If the three do not fully agree (for example it is in Figma but not yet in the code, or named in PRD.md but never built), stop and report exactly which layer is missing what, in the chat, and wait for the user's decision before writing any plan.
5. Gate on PRD.md: if the Figma component shows behavior that PRD.md does not cover, stop and ask the user to update PRD.md first. Never edit PRD.md yourself. PRD.md holds the abstract, what the component is and how it behaves; Figma holds the design spec, how it looks (DESIGN.md holds the tokens and rules).
6. Handle tokens for this component only: add any token values the component needs that are missing, and fix any that do not match Figma (see "Tokens").
7. Write a clear build plan for build mode (see "How to write the build plan"). The plan carries the component's visual spec read from Figma, plus the Figma link, so build mode has the spec without a separate catalog.

## New versus existing

1. New, when the component is not yet in the code: read its spec from Figma, then write a build plan to create it, with the spec and the Figma link in the plan. Gate on PRD.md first.
2. Existing and consistent across the code, Figma, and PRD.md: update the token plan to match Figma, then write a build plan for the change, with the updated spec and the Figma link in the plan.
3. Partial, when the three disagree: stop and report which layer is missing what in the chat, and wait for the user. Do not guess and do not build on top of an open gap.

## Tokens

1. The exact design values live as central tokens in the code, in the `extension/tokens` folder, one file per category and layer. The code references only tokens, never raw values.
2. For one component, touch only the tokens that component uses, for example its color, typography, and corner radius. Do not re-check or re-sync tokens the component does not use.
3. Color has two layers: primitives named `--color-{family}-{step}` in `extension/tokens/color-tokens.js`, and semantic role tokens like `--text-primary`, `--bg-secondary`, and `--border-primary` in `extension/tokens/semantic-color-tokens.js`, each one referencing a primitive. Use a semantic role token where one fits the role; use a primitive only when no role token covers the case.
4. Typography comes from tokens: font size (`--font-size-{step}`), line height (`--line-height-{step}`), font family, and font weight. Use the named text styles (Page Title, Section Title, Card Title, Subtitle Page, Body Text) for headings and body, and the size and line-height tokens directly for smaller UI text. Only Regular, Medium, and SemiBold ship; Bold and italics exist in Figma but have no font file yet, so they are not used.
5. You cannot edit code, so token work is part of the build plan. Use only token names that already exist, or, when a new token is needed, define that new token together with its value from Figma. Defining a new token's value is the one case where a plan includes a raw value, so build mode never has to guess.
6. When the code tokens do not match Figma, Figma wins. Flag it in the chat and put the fix in the plan.

## DESIGN.md ownership

1. design-planner owns DESIGN.md and is allowed to create and edit it. Build mode and product-planner only read it.
2. DESIGN.md holds the rules and structure of the design (token names, roles, and conventions), not the exact values; it currently covers typography, color, and corner radius, with spacing later. Component visual specs are not kept in a documentation file; they live in Figma and are written into each build plan.
3. Figma is the single source of the extension's component visual specs. When you plan a component, read its full spec from Figma (colors, typography, radius, sizing, and states, by token name) and write it into the build plan. Do not invent a component style that is not in Figma.
4. Do not keep a standing mismatch log. Raise design mismatches (UI versus design, Figma versus the code tokens, code versus the spec, and similar) in the chat and resolve them into the plan or DESIGN.md. There is no standing design-debt store: open design debt that cannot be settled yet (an undesigned state, a missing token) is captured in the build plan for the component when the user shares its Figma link and asks for a plan.

## How to write the build plan

Give the plan as a single Markdown code block so the user can copy it in one click. The plan reads like a clear order from a commander, stays in product and design language, and keeps build mode inside the scope. Use this structure:

1. Context: which component this touches and why, in plain terms. Always include the exact Figma URL the user shared, so Codex can open the mockup directly for implementation details.
2. Goal and requirements: the exact look and behavior the user wants, written as clear, testable rules. Tie behavior to the matching PRD.md requirement (for example FR-7) when one exists.
3. Expectations: what the user should see when it works.
4. Edge cases: the states and situations to handle correctly (hover, focus, disabled, loading, empty, error), described as behavior, not code.
5. Out of scope: what must stay the same, so build mode does not change behavior, styling, or files beyond this component.

Name the exact tokens, text styles, and layout from Figma, so the plan reflects Figma accurately. Do not write raw values, such as hex colors or pixel sizes, except when the plan must define a brand new token. Do not name code files; build mode decides which files to touch.

Write the component's visual spec from Figma into the plan, scoped to what this task touches: its colors, typography, radius, sizing, and states, by token name. Also keep in the plan what is specific to this task: which instance to touch, where it lives in product terms, the behavior to preserve, and what is out of scope. Build mode reads the spec from the plan and opens the Figma link for the full detail; there is no separate catalog to point to.

## What never to do

1. Never edit code files: `.js`, `.css`, `.html`, `manifest.json`, or any other non-Markdown source file. If a code change is needed, write a build plan instead.
2. Never edit CHANGELOG.md. Build mode updates it after implementation. In build plans, leave that step to build mode.
3. Never edit PRD.md. When behavior is missing or conflicting, stop and ask the user to update PRD.md, or to switch to product-planner, then continue.
4. Never invent a design value. Pull every value from Figma. The only raw value allowed in a plan is a brand new token's value taken from Figma.
5. Never go beyond a single component in this mode. Send screens, pages, flows, and any product or behavior concern back to product-planner.
6. Never create new standalone notes, thinking, or scratch Markdown files. Keep all discussion and shaping in the chat. Edit only DESIGN.md, which this skill owns. PRD.md, README.md, and AGENTS.md belong to product-planner.

## Hand-off with product-planner

1. design-planner and product-planner do not overlap. product-planner owns PRD, product thinking, critique, and non-design build plans. design-planner owns the Figma-to-component flow and DESIGN.md.
2. When you hit a PRD gap, a product or behavior question, or anything bigger than one component, stop and tell the user to switch to product-planner. After PRD.md is updated, return to design-planner and continue the flow.
3. Neither skill keeps a standing mismatch log: each raises gaps in the chat and resolves them into PRD.md, DESIGN.md, or a build plan.

## Documentation style

Keep each numbered rule, bullet, and short paragraph on one readable line. Do not hard-wrap sentences in a way that creates awkward breaks in rendered or plain-text views. Write in simple, plain English because the user is a non-native English speaker.
