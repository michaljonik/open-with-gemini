// open-with-gemini/options.js
// Settings page. Values live in chrome.storage.sync so they follow the user's
// signed-in Chrome profile.

const DEFAULT_PROMPT_TEMPLATE = "Summarize this: {url}";
const DEFAULT_AUTO_SEND = false;

const textarea = document.getElementById("promptTemplate");
const autoSendBox = document.getElementById("autoSend");
const status = document.getElementById("status");

async function load() {
  const { promptTemplate, autoSend } = await chrome.storage.sync.get([
    "promptTemplate",
    "autoSend",
  ]);
  textarea.value = promptTemplate || DEFAULT_PROMPT_TEMPLATE;
  autoSendBox.checked = autoSend ?? DEFAULT_AUTO_SEND;
}

async function save() {
  const value = textarea.value.trim() || DEFAULT_PROMPT_TEMPLATE;
  await chrome.storage.sync.set({
    promptTemplate: value,
    autoSend: autoSendBox.checked,
  });
  status.textContent = "Saved.";
  setTimeout(() => { status.textContent = ""; }, 2000);
}

document.getElementById("save").addEventListener("click", save);
load();
