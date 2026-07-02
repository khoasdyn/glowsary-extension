---
name: social-content
description: Write or update Glowsary social media posts in English and Vietnamese across LinkedIn, X (Twitter), Threads, and Facebook. Use whenever the user wants to announce a feature, write a launch post, draft a thread, or edit any file in the social-posts/ folder. Captures the user's writing style, the per-platform format, and the archive workflow.
---

# Writing Glowsary social content

This skill is for drafting and editing the promotional posts in the `social-posts/` folder. It is marketing work, so it is done directly without the plan-then-paste-back gate (see CLAUDE.md). Still, every claim must be true to the product: check the feature against `CHANGELOG.md` and `PRD.md` before writing, and never describe a feature the app does not have.

## The folder

One file per platform in `social-posts/`:

- `LinkedIn.md` — English, longer-form, personal-story tone.
- `X (Twitter).md` — English, short thread.
- `Threads.md` — Vietnamese, casual short thread.
- `Facebook.md` — Vietnamese, casual, with a ✨ feature list.

Each post lives inside a plain ` ``` ` code fence so the user can copy it cleanly. Many posts are a small thread: each tweet/post is its own separate fenced block, in order.

## Archive workflow (do not delete old posts)

When writing a new post for a platform, never replace the old one. Put the new post at the top of the file, then move the previous post(s) under a `## Archived Posts` heading below. Add a short `(Date DD Month YYYY)` line above a post when dating it, matching the style already in the file.

## The link

Real Chrome Web Store URL: `https://chromewebstore.google.com/detail/glowsary-build-your-vocab/bfnlhjdjkblhenfhnmdoghfomekcekmj`

Keep the link out of the main post body and put it in the first comment (LinkedIn), a reply tweet (X), or the closing post (Threads/Facebook). This is deliberate: external links in the body hurt reach. Pair the link with a soft "try it / give feedback" line.

## Core writing rules (both languages)

1. Lead with the news, not a generic intro. Do not reuse the same opening line across posts — vary it so posts do not read as duplicates (avoid a fixed "I just shipped a new version of Glowsary…" opener every time).
2. Shorter is better. Cut filler. Merge a "what it is" sentence with a "how it works" sentence instead of spending a paragraph on each.
3. Be honest, never oversell. State real limits plainly (for example, the AI part needs the user's own free Gemini key).
4. Use concrete examples so the reader pictures their own use (for example, "want your meanings in Spanish? just say so"), not abstract claims.
5. Be a critical partner. If a request would create a misunderstanding or oversell the product, flag it before writing. The recurring example in this project: the demo video shows a Vietnamese prompt, so always make clear that Vietnamese is just the user's example and the app follows whatever prompt the user writes (any language). Do not let viewers think the app is Vietnamese-only.

## English style

- First person, plain English. The user is a non-native English speaker, so keep words simple and sentences clear.
- Personal and warm, like a maker sharing a side project, not a press release.
- LinkedIn can carry a short personal story and 3–5 hashtags (a tight set reads better than a long list). X stays tight: 280 characters per tweet, no hashtags unless asked.

## Vietnamese style

- Casual, warm, conversational — the Facebook posts are the reference voice. Use "mình", "bạn", "nha", and a friendly, talking-to-friends tone.
- Write naturally and easy to understand. Split a long or awkward clause into two short sentences. Make cause-and-effect clear (for example, "mỗi khi bạn đọc web mà gặp lại từ đã lưu, nó sẽ được tự động gạch chân").
- No self-praise about the product or the update. Avoid lines like "update mình ưng nhất" or "mình thấy khá hay". Just say what shipped.
- No formal punctuation: do not use a colon ":" to introduce a list or an em dash "—". Use commas and plain sentences instead.

## Platform notes

- **LinkedIn** (English): personal-story opener, the feature, the honest limits, a closing line, then a hashtag line. Add a separate "### First comment" block with the link and a follow + feedback ask.
- **X (Twitter)** (English): 2–3 short tweets, each its own fenced block. Tweet 1 is the hook plus a one-line "what it is"; the reply carries the payoff and the link. Stay under 280 characters per tweet.
- **Threads** (Vietnamese): short thread, each post its own fenced block, under 500 characters each. Same casual voice as Facebook. The buildinpublicvn community is the audience — for a first post there, open with a short hello and introduce the project, and close with a build-in-public feedback ask.
- **Facebook** (Vietnamese): longer casual post, can use a ✨ feature list, link in a separate closing block. Two alternate versions (a feature-list intro and a story-first intro) already exist as a pattern to follow.

## After writing

Show the user the new post and point out any platform-specific choices made (link placement, hashtag count, thread split). Offer to adapt it to the other platforms. Do not log social posts in CHANGELOG.md — that file tracks extension changes, not marketing.
