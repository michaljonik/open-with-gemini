// yt-to-gemini/options.js
// Settings page for the prompt template, stored in chrome.storage.sync so it
// carries over across machines signed into the same Chrome profile.

const DEFAULT_PROMPT_TEMPLATE = "Summarize this: {url}";

const textarea = document.getElementById("promptTemplate");
const status = document.getElementById("status");

async function load() {
  const { promptTemplate } = await chrome.storage.sync.get("promptTemplate");
  textarea.value = promptTemplate || DEFAULT_PROMPT_TEMPLATE;
}

async function save() {
  const value = textarea.value.trim() || DEFAULT_PROMPT_TEMPLATE;
  await chrome.storage.sync.set({ promptTemplate: value });
  status.textContent = "Saved.";
  setTimeout(() => { status.textContent = ""; }, 2000);
}

document.getElementById("save").addEventListener("click", save);
load();
