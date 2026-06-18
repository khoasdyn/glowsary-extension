This file holds the marketing copy for the Chrome Web Store listing. Each section maps to a field in the store's listing form (name, summary, description, category), so you fill the store form by copying from here. It is content only, not product behavior; the source of truth for what the product does is PRD.md. Some fields (Name and Summary) also live in `manifest.json`, as noted per section, and must stay in sync with it.

## Name

```
Glowsary: Build Your Vocabulary as You Read Online
```

This is the title shown on the Chrome Web Store. It comes from the `name` field in `manifest.json`, so the store title and the in-browser name stay the same. Length is 50 characters, within the 75-character store limit.

## Summary from package

```
Highlight your saved vocabulary across the web and reveal your own definitions on demand.
```

This is the short summary shown under the name on the store. Like the Name, it comes from `manifest.json`, from the `description` field, so it must stay in sync with the manifest.

## Description

```
Glowsary turns the web into your personal vocabulary notebook.

When you read in English and look up a word, you save it once with your own meaning, or let AI draft a short definition for you in a tap. You can also add a picture to help it stick. After that, Glowsary quietly underlines that word everywhere it appears as you browse, and shows your saved definition in a small popup when you hover over it. It works like Word Wise on a Kindle, except the words are the ones you chose, and the meaning stays hidden until you ask for it.

What you can do:
- Save any word or phrase while you read. Select the text, right-click, and choose “Add word”, then type your own definition. You can also add a word by hand without selecting anything.
- Let AI write the first draft for you. Press Generate and Glowsary writes a short definition for the word, in English or Vietnamese. It fills the field for you, and you can edit it before saving. Want to use your own Gemini API key? You can add it in Settings.
- Add a picture to any word. Import an image from your computer or paste an image link, so a visual cue helps the word stick alongside your definition.
- Recognize your words again everywhere. Saved words get a subtle underline on every site, so you notice them on sight.
- Read without interruption. The definition shows only when you hover, then gets out of your way.
- Keep more than one meaning for the same word. When a word has several saved meanings, the popup pages through them.
- Hear how a word sounds. Click the speaker icon in the popup or on a word card to hear it spoken aloud.
- Color your words. Tag each saved word with one of four colors to group and tell them apart at a glance.
- Add alternate forms with aliases, so “version” and “versions” share one definition.
- Stay in control. Turn highlighting on or off anytime, and exclude any site where you do not want it.
- Manage everything in one place. Search, sort, edit, and delete your words, add words by hand, and export or import your list as a CSV backup.
- Private by design. Everything is stored on your own device. No account, no sign-in, and your words never leave your computer.

Glowsary is made for self-learners who read English online and want the effort of every lookup to stick.
```

## Category

```
Education
```

## Screenshots

```
You want five Chrome Web Store screenshots (1280x800 PNG), each built around one of your real asset images, each promoting a single feature, with image one acting as a cover. The job right now is to decide what images two through five should show and how they should look, and to catch anything that could go wrong before you hand the prompts to an image AI.
```