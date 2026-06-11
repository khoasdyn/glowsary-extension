# Glowsary Chrome Extension

Glowsary is a Manifest V3 Chrome extension for saving personal vocabulary while you read. You save a word or phrase with your own definition, and Glowsary highlights it everywhere it appears on the web, showing your definition in a small popup when you hover over it. The same word can hold several meanings, you can tag each entry with a color, and you can hear any saved word spoken aloud.

## Load locally

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked**.
4. Select the `extension/` folder inside this project.

## How to use

1. Select a word or phrase on any page, right-click, and choose **Add word**. Type your definition, optionally add aliases and pick a color, then click Save. The right-click action is always available, so you can also choose **Add word** without selecting anything and type the word by hand.
2. The saved word is underlined wherever it appears on the web. Hover over it to see your definition. If a word has more than one saved meaning, the popup pages through them. The popup also has a speaker icon to hear the word and a pencil icon to edit the entry without leaving the page.
3. Click the Glowsary toolbar icon to open the toolbar popup. It has the single on/off switch for all highlighting and a **Go To App** button that opens the management view.
4. In the management view, the Home tab lets you search, sort, add, edit, and delete saved words, hear each word spoken, and import or export your list as CSV. The Settings tab lets you manage excluded sites, where highlighting is suppressed.

## Documentation

See `PRD.md` for the full product requirements and `CHANGELOG.md` for the version history. See `DESIGN.md` for the design system; component visual specs live in Figma and are written into each build plan. All design tokens live in the `extension/tokens` folder, one file per category. Color has two layers: the primitive palette and a semantic role layer that references it.
