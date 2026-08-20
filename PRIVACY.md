# Privacy Policy — Open with Gemini

**Last updated:** 10 August 2026

## Summary

**Open with Gemini does not collect, store, transmit, or sell any personal data.**

The extension has no backend server, no analytics, no telemetry, and no third-party
services. Nothing you do with it is ever sent anywhere except to Google Gemini —
in the same way it would be if you pasted a link into Gemini yourself.

## What the extension does

When you right-click a link and choose "Open with Gemini" (or click the toolbar
icon on the current page), the extension:

1. Reads the URL of the link you right-clicked, or the URL of your current tab.
2. Combines it with your configured prompt template.
3. Opens a new tab to `https://gemini.google.com/app`.
4. Types the resulting text into Gemini's prompt field, where it waits for you to
   review and press Enter.

By default the extension does not submit the prompt — you review it and press Enter
yourself. An optional "Send automatically" setting (off unless you turn it on) makes
the extension submit the prompt for you by simulating the Enter key. Either way, the
extension only ever sends the prompt built from the link you chose; it does not read
Gemini's replies or anything else on the page.

## Data handled

| Data | How it's used | Where it goes |
|---|---|---|
| The URL you right-click (or your current tab's URL) | Inserted into the prompt template | Held briefly in `chrome.storage.session` (browser memory, cleared immediately after use and on browser close), then typed into the Gemini page in your browser |
| Your prompt template | Read to build the prompt | Stored in `chrome.storage.sync` — Chrome's own storage, synced across your signed-in Chrome profiles by Google. Never transmitted to the developer. |
| Your "Send automatically" preference | Read to decide whether to submit the prompt | Stored in `chrome.storage.sync`, same as above. Never transmitted to the developer. |

**No browsing history is collected.** The extension only ever sees the single URL
you explicitly right-click, at the moment you right-click it. It does not observe,
log, or read the pages you visit.

## Data sharing

The developer does not receive, sell, or share any data. There is no data to share —
nothing leaves your browser except the prompt you choose to send to Gemini, which is
governed by [Google's own privacy policy](https://policies.google.com/privacy).

## Permissions and why they're needed

| Permission | Why |
|---|---|
| `contextMenus` | To add the "Open with Gemini" entry to the right-click menu. |
| `activeTab` | To read the current tab's URL when you click the toolbar icon. Grants access only to the tab you're on, only at the moment you click. |
| `storage` | To save your prompt template and "Send automatically" preference, and to briefly pass the pending prompt from the background script to the Gemini tab. |
| Host access to `https://gemini.google.com/*` | To type the prompt into Gemini's input field. This is the only site the extension can touch. |

The extension does **not** request access to all websites. It cannot read or modify
any page other than Gemini.

## Remote code

The extension executes no remote code. All logic is contained in the extension
package you install. The full source is public at
https://github.com/michaljonik/open-with-gemini — you can verify every claim on this
page against it.

## Changes to this policy

Any changes will be published at this URL and reflected in the "Last updated" date
above.

## Contact

Michał Jonik — michal.jonik@gmail.com

Source code: https://github.com/michaljonik/open-with-gemini
Issues and questions: https://github.com/michaljonik/open-with-gemini/issues
