// open-with-gemini/content.js
// Runs automatically on https://gemini.google.com/app* (see manifest.json).
// Picks up a prompt stashed by background.js in chrome.storage.session and
// injects it into Gemini's prompt field.
//
// Submitting is opt-in ("Send automatically" in the options page) and defaults
// to off. When it's off — or when auto-send fails — the prompt is simply left
// in the input box for the user to send with Enter.

const AUTO_SEND_TIMEOUT_MS = 3000; // give up waiting for the Send button
const ENTER_SETTLE_MS = 1500;      // how long to give Enter before the fallback
const CLEAR_POLL_MS = 100;         // how often to check whether the input emptied

(async function main() {
  const { pendingPrompt } = await chrome.storage.session.get("pendingPrompt");
  if (!pendingPrompt) return;

  // Clear immediately so a page refresh / back-nav doesn't re-inject stale text.
  await chrome.storage.session.remove("pendingPrompt");

  const { autoSend } = await chrome.storage.sync.get("autoSend");

  const input = await waitForInput();
  if (!input) return;

  setText(input, pendingPrompt);

  if (autoSend) {
    await trySend(input);
  }
})();

function findInput() {
  return (
    document.querySelector('rich-textarea div[contenteditable="true"]') ||
    document.querySelector('div[contenteditable="true"]')
  );
}

// Gemini renders the input async after SPA bootstrap, so poll via MutationObserver.
function waitForInput() {
  return new Promise((resolve) => {
    const existing = findInput();
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = findInput();
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Don't watch forever if something's broken (e.g. selector changed upstream).
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, 15000);
  });
}

function setText(el, text) {
  el.focus();
  // Gemini's input is an Angular/Lit-managed contenteditable div — setting
  // .textContent directly is silently ignored by the framework's internal
  // state. execCommand + a real InputEvent mimics actual typing so it sticks.
  document.execCommand("insertText", false, text);
  el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
}

function isInputEmpty(el) {
  return !el.textContent.trim();
}

// Climb a few levels up from the input to get the composer area, so we don't
// match a same-icon button elsewhere on the page (e.g. a scroll-to-top control).
function composerRoot(input) {
  let el = input;
  for (let i = 0; i < 6 && el.parentElement; i++) el = el.parentElement;
  return el;
}

// Locate the Send button WITHOUT relying on aria-label — that text is localised
// ("Wyślij wiadomość" in Polish, etc.). Gemini renders the button's glyph as a
// Material icon named "arrow_upward", which is language-independent.
const SEND_ICON_SELECTOR =
  'mat-icon[fonticon="arrow_upward"], mat-icon[data-mat-icon-name="arrow_upward"]';

function findSendButton(input) {
  const scopes = [composerRoot(input), document];
  for (const scope of scopes) {
    for (const icon of scope.querySelectorAll(SEND_ICON_SELECTOR)) {
      const btn = icon.closest("button");
      if (btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true") {
        return btn;
      }
    }
  }
  return null;
}

// The Send button stays disabled until the framework has registered the new
// input. Its transition to enabled is our signal that Gemini is ready to accept
// a submit — both for the Enter key and for a click.
function waitForSendButton(input, timeoutMs) {
  const findButton = () => findSendButton(input);

  return new Promise((resolve) => {
    const existing = findButton();
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const btn = findButton();
      if (btn) {
        observer.disconnect();
        resolve(btn);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// Wait until Gemini is actually ready, then try Enter, then fall back to
// clicking Send. Order matters: firing Enter straight after setText() is a
// no-op, because Angular hasn't registered the injected text yet. The Send
// button flipping to enabled is the readiness signal we wait on.
//
// Both paths fail silently — worst case the prompt just sits in the input for
// the user to send with Enter, which is the default behaviour anyway.
async function trySend(input) {
  // Used purely as a readiness gate — the resolved node is deliberately not kept,
  // because it gets repurposed into the Stop button once generation begins.
  await waitForSendButton(input, AUTO_SEND_TIMEOUT_MS);

  const enterOpts = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  };
  input.focus();
  input.dispatchEvent(new KeyboardEvent("keydown", enterOpts));
  input.dispatchEvent(new KeyboardEvent("keyup", enterOpts));

  // Poll rather than checking once at a fixed deadline: Gemini can clear the
  // input a little later than expected, and a single early check would wrongly
  // conclude that Enter failed.
  if (await waitForInputToClear(input, ENTER_SETTLE_MS)) return;

  // Enter didn't take. Re-resolve the button from scratch — never reuse the
  // earlier reference. Once generation starts Angular turns that very same
  // element into a Stop button, so clicking the stale node would abort the
  // reply we just sent. findSendButton() matches on the send glyph, so if the
  // button has become Stop it returns null and we correctly do nothing.
  const button = findSendButton(input);
  if (button && !isInputEmpty(input)) button.click();
}

// Resolves true as soon as the input is empty, false if it never empties.
function waitForInputToClear(input, timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      if (isInputEmpty(input)) return resolve(true);
      if (Date.now() >= deadline) return resolve(false);
      setTimeout(tick, CLEAR_POLL_MS);
    };
    tick();
  });
}
