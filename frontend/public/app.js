const form = document.getElementById("enhance-form");
const textarea = document.getElementById("description");
const counter = document.getElementById("counter");
const submitBtn = document.getElementById("submit");
const clearBtn = document.getElementById("clear");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const enhancedEl = document.getElementById("enhanced");
const originalEl = document.getElementById("original");
const copyBtn = document.getElementById("copy");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");

const MIN_LENGTH = 3;
const MAX_LENGTH = 2000;

let lastEnhanced = "";

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Render the small subset of Markdown the model tends to emit: bold, italics, bullet lists, paragraphs.
function renderMarkdown(text) {
  const inline = (s) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");

  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && lines.every((l) => /^[-*•]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^[-*•]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map((l) => inline(l.replace(/^#+\s*/, ""))).join("<br>")}</p>`;
    })
    .join("");
}

function toPlainText(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1$2").trim();
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle("loading", loading);
  submitBtn.querySelector(".submit-label").textContent = loading ? "Enhancing…" : "Enhance listing";
}

function updateCounter() {
  counter.textContent = `${textarea.value.length} / ${MAX_LENGTH}`;
}

function errorMessage(data, status) {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return `Request failed (${status})`;
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error();
    const data = await res.json();
    statusEl.dataset.state = data.ai_available ? "ok" : "degraded";
    statusText.textContent = data.ai_available ? `Model: ${data.model}` : "AI model unavailable";
  } catch {
    statusEl.dataset.state = "down";
    statusText.textContent = "Backend unreachable";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const description = textarea.value.trim();

  if (description.length < MIN_LENGTH) {
    showError(`Please enter at least ${MIN_LENGTH} characters.`);
    textarea.focus();
    return;
  }

  showError("");
  setLoading(true);

  try {
    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(errorMessage(data, res.status));

    lastEnhanced = data.enhanced;
    enhancedEl.innerHTML = renderMarkdown(data.enhanced);
    originalEl.textContent = data.original;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
});

textarea.addEventListener("input", updateCounter);

textarea.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) form.requestSubmit();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    textarea.value = chip.textContent;
    updateCounter();
    textarea.focus();
  });
});

clearBtn.addEventListener("click", () => {
  textarea.value = "";
  updateCounter();
  showError("");
  resultEl.hidden = true;
  textarea.focus();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(toPlainText(lastEnhanced));
    copyBtn.textContent = "Copied!";
  } catch {
    copyBtn.textContent = "Copy failed";
  }
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});

updateCounter();
checkHealth();
