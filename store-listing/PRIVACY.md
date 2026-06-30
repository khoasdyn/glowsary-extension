# Glowsary Privacy Policy

Last updated: June 30, 2026

Glowsary is a browser extension that lets you save words and phrases with your own definitions while you read on the web, highlights those saved words on the pages you visit, and shows your saved definition in a small popup when you hover or click. It also has two optional features that connect to the internet when you choose to use them: an AI helper that can draft a definition for you, and support for adding an image to a word by pasting a web link. This policy explains what data Glowsary handles, how it is handled, where it is stored, and when any of it is shared.

## The short version

Glowsary has no account, no sign-in, and no server of its own. Everything you save stays on your own device by default. Glowsary never sells your data and never tracks your browsing. The only time your data leaves your device is when you choose to use one of two optional features: pressing the AI "Generate" button sends the word or phrase to Google's Gemini service, and adding an image by web link loads that image from the website you linked to. Both are explained in full below.

## What Glowsary stores, and where

Glowsary stores all of the following on your own device, using your browser's local storage. None of it is sent to us, because Glowsary has no server to send it to.

- The words and phrases you save, your definitions, and any aliases you add.
- Any image you attach to a word: a picture you upload from your computer is stored on your device, and a pasted image link is stored as the link only (see "Images").
- Your settings, such as whether highlighting is on or off and your chosen auto-generate language and prompt.
- Your list of excluded sites, where you have chosen to turn highlighting off.
- Your own Google Gemini API key, if you choose to add one for the AI feature (see "AI-generated definitions"). It is stored only on your device and is used only to authenticate your own requests to Google.

This information stays on your device. We do not collect it, receive it, or have any way to access it.

## How Glowsary handles the pages you read

To highlight your saved words, Glowsary reads the text of the pages you visit, inside your browser, to find matches. This reading happens entirely on your device. Glowsary does not record, store, transmit, or send the content of the pages you read to us or to anyone else.

## AI-generated definitions (optional)

The Definition field has an optional "Generate" button that can draft a short definition for you using AI. This feature is off until you set it up, and it never runs on its own — it sends a request only when you click "Generate".

- To use it, you add your own Google Gemini API key in the extension's Settings. There is no shared key inside the extension; the feature runs entirely on your own key and your own Google account.
- When you click "Generate", Glowsary sends the single word or phrase you are defining, together with your chosen instruction prompt, to Google's Generative Language (Gemini) API. It does not send your other saved words, your definitions, your browsing history, or the content of the page you are reading.
- The request is sent directly from your browser to Google using your API key. Glowsary has no server in between and never receives a copy of the request or the response.
- Because this data goes to Google, Google's handling of it is governed by Google's own terms and privacy policy for the Gemini API. Please review Google's policies to understand how Google processes data sent with your key.
- If you never add a key and never press "Generate", no word or phrase is ever sent anywhere for this feature.

## Images

You can attach an image to a saved word in two ways, and they are handled differently:

- Upload from your computer: the image is stored on your own device, as part of your local data. It is not uploaded to us or to anyone else.
- Paste a web link: Glowsary stores only the link and loads the image from that website each time it is shown. This means your browser makes a request to that website (the one you linked to) to fetch the image, the same as any normal web page loading an image. Glowsary does not copy or keep the picture, and the request goes to the site you chose, not to us.

## The tutorial video in Settings

The Settings page embeds a short tutorial video using YouTube's privacy-enhanced player (youtube-nocookie.com). The video loads from YouTube, and YouTube may receive standard request information when the player loads or when you press play, under YouTube's own privacy policy. No other data from Glowsary is shared with YouTube.

## Why Glowsary asks for permissions

- Reading and changing data on the websites you visit: needed to find and underline your saved words on the pages you read and to show their definitions, and to load an image you added by web link.
- Storage: needed to save your words, settings, excluded sites, and your optional Gemini API key on your device.
- Tabs: needed to apply your setting changes across open tabs and to avoid opening duplicate settings tabs. It is not used to track your browsing history.
- Right-click menu: needed to add the "Add word" action so you can save selected text.
- Network access to Google's Gemini service: used only for the optional AI "Generate" feature described above, and only when you click it.

## Export and import

Glowsary lets you export your saved words to a file and import them back. This is started by you, and the file is saved to your own computer. Glowsary does not upload these files anywhere. The backup file is a JSON file that includes your saved words with their definitions, aliases, colors, and images: a pasted image link is saved as the link, and a picture you uploaded from your computer is included in full so it restores intact.

## Selling and sharing of data

Glowsary does not sell your data. Glowsary does not share your data with anyone, except in the two cases you trigger yourself: the word or phrase you send to Google when you press "Generate", and the request your browser makes to a website to load an image you added by link. There is no advertising, no analytics, and no tracking.

## Deleting your data

You can delete any saved word from the management view at any time, and you can delete your saved Gemini API key in Settings. Removing the extension from your browser deletes all of the data Glowsary stored on your device.

## Children

Glowsary is a general-purpose reading tool and is not directed at children.

## Changes to this policy

If this policy changes, the updated version will be posted at this same page with a new "Last updated" date.

## Contact

If you have questions about this policy, contact: khoasdyn@gmail.com