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
- Manage everything in one place. Search, sort, edit, and delete your words, add words by hand, and export or import your list as a JSON backup.
- Private by design. Everything is stored on your own device. No account, no sign-in, and your words never leave your computer.

Glowsary is made for self-learners who read English online and want the effort of every lookup to stick.
```

## Category

```
Education
```

## Single purpose

An extension must have a single purpose that is narrow and easy-to-understand. [Learn more](https://developer.chrome.com/webstore/program_policies#extensions)


```
Glowsary lets a reader save words and phrases with their own definitions while reading on the web. It then highlights those saved words on the pages the user visits and shows the saved definition in a small popup on hover or click. Its single purpose is to help readers recognize and recall the vocabulary they have looked up.
```

## Permission justification

A [permission](https://developer.chrome.com/extensions/declare_permissions) is either one of a list of known strings, such as "activeTab", or a [match pattern](https://developer.chrome.com/extensions/match_patterns) giving access to one or more hosts.  
Remove any permission that is not needed to fulfill the single purpose of your extension. Requesting an unnecessary permission will result in this version being rejected.

**contextMenus justification**

```
Glowsary adds an "Add word" item to the right-click menu so the user can save the text they have selected on a page as a vocabulary entry. This context menu item is the main way a user saves a word while reading.
```

**storage justification**

```
Glowsary uses local storage to save the user's vocabulary entries (words, definitions, aliases, colors, and images), their settings (highlighting on or off, the hover or click trigger, and the auto-generate language and prompt), their excluded sites list, and — only if the user chooses to set it up — their own Google Gemini API key for the optional AI definition feature. All of this is stored only on the user's own device. The single word or phrase the user sends to Google's Gemini service when they click the optional "Generate" button (using their own key) is the only data that ever leaves the device.
```

**tabs justification**

```
Glowsary uses the tabs permission to apply setting changes live across all open tabs, for example turning highlighting on or off, and to focus an already-open management tab instead of opening a duplicate when the user opens settings. It does not read or track browsing history.
```

**declarativeNetRequestWithHostAccess justification**

```
Glowsary uses declarativeNetRequestWithHostAccess for a single static rule that sets a Referer header on the embedded tutorial video's frame request, so the YouTube player loads correctly inside the extension's Settings page (without it, the embed fails with "Error 153"). The rule is tightly scoped: it matches only the one tutorial video's embed URL on youtube.com and youtube-nocookie.com and applies only to that sub-frame request. It does not block, redirect, or read any other network traffic, and it does not observe the user's browsing.
```

**Host permission justification**

```
Glowsary's core purpose is to highlight the user's saved words on the pages they read. Because a user may read English on any website, the content script must run on the sites the user visits to find and underline saved words and show their definitions. Page text scanned for highlighting is processed only locally and is never collected or transmitted. Host access is also used to load an image the user added by web link, and — for the optional AI feature — to send the single chosen word or phrase to Google's Gemini service using the user's own key.
```

**Are you using remote code?**

[✓] No, I am not using Remote code
[] Yes, I am using Remote code

## Data usage

The content of this form will be displayed publicly on the item detail page. By publishing your item, you are certifying that these disclosures reflect the most up-to-date content of your privacy policy.

![[CleanShot 2026-06-30 at 09.34.49@2x.png]]

## Privacy policy

An extension must have a privacy policy if it collects user data. [Learn more](https://developer.chrome.com/docs/webstore/program-policies/privacy/)

https://github.com/khoasdyn/glowsary-extension-privacy/blob/main/PRIVACY.md