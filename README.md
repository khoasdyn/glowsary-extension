# Glowsary Chrome Extension

Glowsary is a Manifest V3 Chrome extension for saving personal vocabulary while you read. You save a word or phrase with your own definition, and Glowsary highlights it everywhere it appears on the web, showing your definition in a small popup when you hover over it.

## Load locally

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked**.
4. Select the `extension/` folder inside this project.

## How to use

1. Select a word or phrase on any page, right-click, and choose **Add Word**. Type your definition, optionally add aliases and pick a color tag, then click Save.
2. The saved word is underlined wherever it appears on the web. Hover over it to see your definition.
3. Click the Glowsary toolbar icon to open the toolbar popup, where you can turn highlighting on or off and exclude the current site in one click.
4. In the popup, click the settings button to open the management view in a new tab. The Home tab lets you search, sort, add, edit, and delete saved words, and import or export your list as CSV. The Settings tab lets you manage excluded sites.

## Documentation

See `PRD.md` for the full product requirements and `CHANGELOG.md` for the version history. See `DESIGN.md` for the design system; component visual specs live in Figma and are written into each build plan. All design tokens live in the `extension/tokens` folder, one file per category. Color has two layers: the primitive palette and a semantic role layer that references it.
