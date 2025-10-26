/* script.js
   Features:
   - persistent quotes stored in localStorage under key "quotes"
   - sessionStorage used to remember last shown quote index ("lastQuoteIndex")
   - export / import to/from JSON file
   - dynamic add/edit/remove and UI updates
*/

// ---- DOM refs ----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quoteInput = document.getElementById("newQuoteText");
const categoryInput = document.getElementById("newQuoteCategory");
const quoteList = document.getElementById("quoteList");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// ---- storage keys ----
const LOCAL_KEY = "quotes";
const SESSION_KEY = "lastQuoteIndex";

// ---- Application state ----
// load quotes from localStorage, or start with defaults
let quotes = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

// ---- helpers ----
function saveQuotes() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
}

function showMessage(msg) {
  // small fallback alert - you can replace this with a nicer toast
  alert(msg);
}

// ---- display logic ----
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available. Add one below!";
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }

  // try to reuse last index stored in session so the same random quote isn't repeated unnecessarily
  let lastIndex = parseInt(sessionStorage.getItem(SESSION_KEY), 10);
  if (Number.isNaN(lastIndex)) lastIndex = -1;

  let idx;
  if (quotes.length === 1) {
    idx = 0;
  } else {
    do {
      idx = Math.floor(Math.random() * quotes.length);
    } while (idx === lastIndex);
  }

  const q = quotes[idx];
  quoteDisplay.innerHTML = `<p class="quote-text">"${escapeHtml(q.text)}"</p>
                            <p class="category">— Category: ${escapeHtml(q.category)}</p>`;
  // remember index for this session
  sessionStorage.setItem(SESSION_KEY, idx);
}

// safe small helper to avoid basic HTML injection when showing user-provided text
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---- rendering the full quote list with actions ----
function renderQuoteList() {
  quoteList.innerHTML = "";

  if (quotes.length === 0) {
    quoteList.innerHTML = "<p>No stored quotes yet.</p>";
    return;
  }

  quotes.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "quote-item";
    item.innerHTML = `
      <div style="flex:1">
        <div class="quote-text">"${escapeHtml(q.text)}"</div>
        <div class="category">— ${escapeHtml(q.category)}</div>
      </div>
      <div class="quote-actions" style="display:flex; gap:6px;">
        <button class="edit-btn" data-index="${i}">Edit</button>
        <button class="remove-btn" data-index="${i}">Remove</button>
      </div>
    `;

    quoteList.appendChild(item);
  });

  // attach listeners after rendering
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      removeQuote(idx);
    });
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      startEditQuote(idx);
    });
  });
}

// ---- add / remove / edit ----
function addQuote() {
  const text = quoteInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    showMessage("Please fill both Quote and Category fields.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  renderQuoteList();

  // optionally show newly added quote
  quoteDisplay.innerHTML = `<p class="quote-text">"${escapeHtml(text)}"</p>
                            <p class="category">— Category: ${escapeHtml(category)}</p>`;

  // clear inputs
  quoteInput.value = "";
  categoryInput.value = "";
  showMessage("Quote added and saved to localStorage!");
}

function removeQuote(index) {
  if (!Number.isFinite(index) || index < 0 || index >= quotes.length) return;
  if (!confirm("Remove this quote?")) return;

  quotes.splice(index, 1);
  saveQuotes();
  renderQuoteList();
  showMessage("Quote removed.");
}

function startEditQuote(index) {
  if (!Number.isFinite(index) || index < 0 || index >= quotes.length) return;
  const q = quotes[index];
  // populate inputs and remove original so user can click Add to save changes
  quoteInput.value = q.text;
  categoryInput.value = q.category;
  quotes.splice(index, 1);
  saveQuotes();
  renderQuoteList();
  showMessage("Edit the fields and click Add to save changes.");
}

// ---- export to JSON file ----
function exportToJson() {
  if (quotes.length === 0) {
    showMessage("No quotes to export.");
    return;
  }

  const jsonStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `quotes_export_${new Date().toISOString().slice(0,19).replaceAll(":", "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- import from file (validate) ----
function importFromJsonFile(file) {
  if (!file) {
    showMessage("No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);

      if (!Array.isArray(imported)) {
        showMessage("Invalid format: JSON must be an array of quote objects.");
        return;
      }

      // validate each entry
      const valid = imported.every(item =>
        item && typeof item.text === "string" && typeof item.category === "string"
      );

      if (!valid) {
        showMessage("Invalid data: each quote must be an object with 'text' and 'category' strings.");
        return;
      }

      // Merge: push all imported quotes
      quotes.push(...imported);
      saveQuotes();
      renderQuoteList();
      showMessage("Quotes imported successfully!");
    } catch (err) {
      console.error(err);
      showMessage("Failed to parse JSON file. Make sure it is valid JSON.");
    }
  };

  reader.readAsText(file);
}

// ---- init on load ----
function init() {
  // If localStorage had quotes, they are already loaded into quotes variable above
  renderQuoteList();

  // show either last viewed (session) or a random one
  const lastIndex = parseInt(sessionStorage.getItem(SESSION_KEY), 10);
  if (!Number.isNaN(lastIndex) && lastIndex >= 0 && lastIndex < quotes.length) {
    // show the last viewed quote
    const q = quotes[lastIndex];
    quoteDisplay.innerHTML = `<p class="quote-text">"${escapeHtml(q.text)}"</p>
                              <p class="category">— Category: ${escapeHtml(q.category)}</p>`;
  } else {
    showRandomQuote();
  }
}

// ---- event wiring ----
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportToJson);

// file input change listener
importFile.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) importFromJsonFile(f);
});

// Save quotes when window unloads (optional)
window.addEventListener("beforeunload", () => {
  saveQuotes();
});

// kick off
init();
