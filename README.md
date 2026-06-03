# Glowsary Chrome Extension

Glowsary is a vanilla Manifest V3 Chrome extension for saving personal vocabulary words and highlighting those saved words across the web.

## Load Locally

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose **Load unpacked**.
4. Select the `extension/` folder inside this project.

Click the extension icon to open the management page. Select text on a webpage, right-click, and choose **Add word** to save a word or phrase from the page.

## Manual Test

Open `extension/manual-test.html` in Chrome after loading the extension. Save terms such as `love`, `get`, `get it`, and `get in` to verify exact matching, longer-match priority, phrase spacing, editable-area skipping, and dynamic content highlighting.
