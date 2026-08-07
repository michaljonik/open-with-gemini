// yt-to-gemini/content.js
// Runs automatically on https://gemini.google.com/app* (see manifest.json).
// Picks up a prompt stashed by background.js in chrome.storage.session and
// injects it into Gemini's prompt field. Does NOT auto-submit — Michał hits
// Enter himself after checking the text landed correctly (the Send-button
// selector changes more often than the input field, so we don't rely on it).

(async function main() {
  const { pendingPrompt } = await chrome.storage.session.get("pendingPrompt");
  if (!pendingPrompt) return;

  // Clear immediately so a page refresh / back-nav doesn't re-inject stale text.
  await chrome.storage.session.remove("pendingPrompt");

  const findInput = () =>
    document.querySelector('rich-textarea div[contenteditable="true"]') ||
    document.querySelector('div[contenteditable="true"]');

  const setText = (el) => {
    el.focus();
    // Gemini's input is an Angular/Lit-managed contenteditable div — setting
    // .textContent directly is silently ignored by the framework's internal
    // state. execCommand + a real InputEvent mimics actual typing so it sticks.
    document.execCommand("insertText", false, pendingPrompt);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
  };

  const existing = findInput();
  if (existing) {
    setText(existing);
    return;
  }

  // Field not in the DOM yet — Gemini renders it async after SPA bootstrap.
  const observer = new MutationObserver(() => {
    const el = findInput();
    if (el) {
      observer.disconnect();
      setText(el);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Don't watch forever if something's broken (e.g. selector changed upstream).
  setTimeout(() => observer.disconnect(), 15000);
})();
