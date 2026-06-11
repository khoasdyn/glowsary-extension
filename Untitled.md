## Build plan: management view header logo and spacing fixes

### Context
This updates the shared header and a few spacing values on the management view (the options page, both Home and Settings tabs share this header). Two goals: add the brand logo above the "Welcome to Glowsary!" title, and bring three spacing values back in line with the Figma mockup. Covered by PRD FR-38, which now says the header shows a centered logo with the centered title directly below it.

Figma: https://www.figma.com/design/bwESrhKV83fHVEjzveMxbQ/glowsary-extension-06062026?node-id=20-1842&t=gVUXmIEC6CQrs0JQ-11

The logo asset already exists in the repo at `extension/assets/Logo@2x.png`. The file is 160px wide for retina; it must be displayed at 80px.

### Goal and requirements
1. Add the logo to the shared header, above the "Welcome to Glowsary!" title. Use the existing asset `assets/Logo@2x.png`. Display it at 80 by 80 px (the source is 160px, scaled down 2x for retina sharpness).
2. The logo and the title are a centered vertical stack: logo on top, title directly below, both centered horizontally. The gap between the bottom of the logo and the top of the title is 12px (matches Figma).
3. Change the gap between the header block (logo plus title) and the tab nav below it from 24px to 32px, to match Figma.
4. Change the page top padding from 80px to 64px, to match Figma. Side gutters and the bottom padding stay as they are.
5. Leave all other spacing as is. It already matches Figma and must not change: tab nav to content gap 64px, "Saved Words" title to subtitle 8px, header to search row 20px, header block to card grid 32px, search box to sort dropdown 12px, and the 4-column word-card grid at 16px gaps with 16px card padding.
6. The logo is decorative. It needs an empty alt text (or equivalent) so screen readers skip it, since the "Welcome to Glowsary!" title already names the page.

### Expectations
- On both the Home and Settings tabs, the header shows the logo centered at 80px, with "Welcome to Glowsary!" centered directly below it, then the Home / Settings tab nav below that.
- The logo image looks sharp on high-density (retina) screens because the source file is 160px shown at 80px.
- The header sits a little higher on the page (64px top padding) and there is slightly more breathing room (32px) between the title and the tab nav than before.

### Edge cases
- Narrow width (the existing 760px breakpoint and below): the logo stays centered above the title and stays at 80px. The layout must not break or overlap; the title still wraps or stays on its line as it does today.
- The logo must render the same on both tabs, since the header is shared and stays visible when switching tabs.
- If the asset fails to load, the title and tab nav must still lay out correctly; the missing logo must not leave a broken-image box that shifts the title.

### Out of scope
- Do not change the title text, the tab nav, the search row, the sort dropdown, the word cards, or any Settings-tab content.
- Do not change any spacing other than the two listed (header-to-tabs 24 to 32, and page top padding 80 to 64).
- Do not introduce spacing tokens or refactor spacing into the token system; use the raw px values above for now. A spacing token scale is a separate, larger effort.
- Do not change behavior anywhere; this is visual only.
- Do not edit CHANGELOG.md as part of planning; update it after implementation per your normal flow.