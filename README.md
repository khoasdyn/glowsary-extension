# Glowsary Chrome Extension

Glowsary is a Manifest V3 Chrome extension for saving personal vocabulary while you read. You save a word or phrase with your own definition, and Glowsary highlights it everywhere it appears on the web, showing your definition in a small popup on hover or click.

## Load locally

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked**.
4. Select the `extension/` folder inside this project.

## How to use

1. Select a word or phrase on any page, right-click, and choose **Add word**, then type your definition and save.
2. The saved word is underlined wherever it appears. Hover or click it to see your definition.
3. Click the Glowsary toolbar icon to open the toolbar popup, where you can turn highlighting on or off, switch the reveal trigger between hover and click, and exclude the current site.
4. In the popup, click the settings button to open the management view in a new tab, where you can search, sort, edit, delete, add words by hand, manage excluded sites, and import or export your list as CSV.

## Documentation

See `PRD.md` for the full product requirements and `CHANGELOG.md` for the version history. See `DESIGN.md` for the design system. Color has two layers: the primitive palette in `extension/color-tokens.js`, and a semantic role layer that references it.
