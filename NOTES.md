# Notes and open mismatches

This file is the running log of mismatches and open gaps across the project: between the UI and the design, between Figma and the code tokens, between a request and PRD.md, between PRD.md and DESIGN.md, and anything else that does not line up yet. Claude records items here so nothing is lost while a decision is pending. Each item stays until it is resolved, then it is marked done or removed.

How to read an item: the area it touches, what the mismatch or gap is, and its status. Open means it still needs a decision or a fix. Resolved means it is settled.

## Open

1. Button spacing and sizing have no tokens. The button needs a fixed height (40), inner padding (20 left and right, 12 top and bottom), a gap between text and icon (8), and an icon size (20). None of these have tokens, because the spacing and sizing scale is not defined yet. Area: DESIGN.md and code tokens. Status: open, waiting on a spacing and sizing token scale from Figma before the button can reference them.
2. Button has no interaction states. Figma defines only four static states (Default, Secondary, Destructive, Disabled). There is no hover, focus, or pressed state. Area: Figma and UI. Status: open, waiting on the user to design these states in Figma.
3. Destructive button has no background and no border. In Figma the Destructive state has a transparent background and no border, so it reads as plain red text and icon on the page. This may be intended, or it may need a border or a light red background. Area: Figma and UX. Status: open, waiting on a design decision from the user.
