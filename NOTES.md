# Notes and open mismatches

This file is the running log of mismatches and open gaps across the project: between the UI and the design, between Figma and the code tokens, between a request and PRD.md, between PRD.md and DESIGN.md, and anything else that does not line up yet. Claude records items here so nothing is lost while a decision is pending. Each item stays until it is resolved, then it is marked done or removed.

How to read an item: the area it touches, what the mismatch or gap is, and its status. Open means it still needs a decision or a fix. Resolved means it is settled.

## Open

4. Switch current code does not match the new Figma spec. The current switches use a green on state (emerald-700), a 42 by 24 track with an 18 knob, and no knob shadow. Figma now specifies a dark on state (`--bg-primary-solid`), a 54 by 28 track with a 20 knob, an off track of `--bg-quaternary` with a `--border-primary` border, and the `--shadow-xs-skeuomorphic` knob shadow. Area: UI versus Figma. Status: open, a Codex plan will update all three switches to match; close once Codex implements it.
5. Switch has no disabled, hover, pressed, or focus state in Figma. Figma defines only off and on. For accessibility the switch keeps a visible keyboard focus indicator until Figma defines a focus style. Area: Figma and UX. Status: open, waiting on a design decision from the user.
6. Switch sizing and spacing have no tokens. The track (54 by 28), padding (4 top and bottom, 6 left and right), and the knob (20 by 20) are temporary raw values in the Switch spec, because no spacing or sizing scale exists yet. Same debt as the Text Button (item 1). Area: DESIGN.md and code tokens. Status: open, debt; swap for tokens once the scale lands.
7. Shadows have no spacing or sizing token dependency, but they are a brand new token category. The shadow effect colors and the `--shadow-xs-skeuomorphic` style were added to DESIGN.md with their values from Figma so Codex can build the `extension/tokens/shadow-tokens.js` file. Area: DESIGN.md and code tokens. Status: open, closes once Codex creates the shadow token file.

1. Text Button spacing and sizing have no tokens. The Text Button needs a fixed height (40), inner padding (20 left and right, 12 top and bottom), a gap between text and icon (8), and an icon size (20). None of these have tokens, because the spacing and sizing scale is not defined yet. Area: DESIGN.md and code tokens. Status: open, debt. The user chose to ship the button with these as temporary raw values for now (decision 2026-06-08). They must be swapped for tokens once a spacing and sizing scale is defined in Figma. The button is the place to revisit when that scale lands.
2. Text Button has no interaction states. Figma defines only four static states (Default, Secondary, Destructive, Disabled). There is no hover, focus, or pressed state. Area: Figma and UI. Status: open, waiting on the user to design these states in Figma.
3. Destructive Text Button variant has no background and no border. In Figma the Destructive state has a transparent background and no border, so it reads as plain red text and icon on the page. This may be intended, or it may need a border or a light red background. Area: Figma and UX. Status: open, waiting on a design decision from the user. Note: after the Text Button is applied to all buttons (decision 2026-06-08), the Delete buttons move from a solid red fill to this transparent red-text style, so Delete looks weaker. Revisit once the Destructive look is decided in Figma.

## Resolved

- Switch/toggle component had no spec in DESIGN.md or Figma. Resolved 2026-06-08: the user designed the Switch in Figma; Claude added the Switch entry to the Components section and a Shadows section for the knob's `--shadow-xs-skeuomorphic` style. Follow-up mismatches from the design are tracked as open items 4 to 7.
