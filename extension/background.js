// yt-to-gemini/background.js
// Manifest V3 service worker.
// Two entry points:
//  1) Right-click on any link (in a list, without opening it) — main use case.
//     Originally YouTube-only; generalized to all links since Gemini itself
//     figures out whether it's looking at a video, article, or anything else.
//  2) Toolbar icon click on the current tab — secondary use case.
//
// Flow: stash the prompt in chrome.storage.session, then open a fresh Gemini
// tab. content.js (declared as a content_script for gemini.google.com/app in
// manifest.json) picks the pending prompt up on load and injects it. This
// avoids racing chrome.tabs.onUpdated / executeScript timing against Gemini's
// own SPA bootstrap.

const GEMINI_URL = "https://gemini.google.com/app";

// Default prompt template — user-editable via the options page (options.html).
// Stored in chrome.storage.sync under "promptTemplate", must contain {url}.
// Kept generic (not video-specific) since the menu now fires on any link.
const DEFAULT_PROMPT_TEMPLATE = "Summarize this: {url}";

async function getPromptTemplate() {
  const { promptTemplate } = await chrome.storage.sync.get("promptTemplate");
  return promptTemplate || DEFAULT_PROMPT_TEMPLATE;
}

// chrome.storage.session defaults to TRUSTED_CONTEXTS only (background/popup),
// which is why content.js was throwing "Access to storage is not allowed from
// this context." Content scripts need explicit opt-in, and this access level
// resets on every browser restart, so set it on both onInstalled and onStartup.
function allowSessionStorageFromContentScripts() {
  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  allowSessionStorageFromContentScripts();

  // Seed the default template on first install only — don't clobber an
  // existing user edit on extension update.
  const { promptTemplate } = await chrome.storage.sync.get("promptTemplate");
  if (!promptTemplate) {
    await chrome.storage.sync.set({ promptTemplate: DEFAULT_PROMPT_TEMPLATE });
  }

  // removeAll() first: create() throws on a duplicate id and silently leaves the
  // old menu item in place, so edits to the title wouldn't show up on reload.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "yt-to-gemini-link",
      title: "Open with Gemini",
      contexts: ["link"],
      // No targetUrlPatterns — fires on any link (video, article, whatever).
    });
  });
});

chrome.runtime.onStartup.addListener(allowSessionStorageFromContentScripts);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "yt-to-gemini-link" && info.linkUrl) {
    openGeminiWithPrompt(info.linkUrl);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab?.url) {
    openGeminiWithPrompt(tab.url);
  }
});

async function openGeminiWithPrompt(url) {
  const template = await getPromptTemplate();
  const prompt = template.includes("{url}")
    ? template.replace("{url}", url)
    : `${template} ${url}`; // fallback if the user deleted the placeholder
  await chrome.storage.session.set({ pendingPrompt: prompt });
  chrome.tabs.create({ url: GEMINI_URL });
}
