// ---- DOM references ----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quoteInput = document.getElementById("newQuoteText");
const categoryInput = document.getElementById("newQuoteCategory");
const quoteList = document.getElementById("quoteList");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");

// ---- storage keys ----
const LOCAL_KEY = "quotes";
const SESSION_KEY = "lastQuoteIndex";
const FILTER_KEY = "selectedCategory";

// ---- app state ----
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
  alert(msg);
}

// ---- populate categories dynamically ----
function populateCategories() {
  // Get unique categories
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter from localStorage
  const savedFilter = localStorage.getItem(FILTER_KEY);
  if (savedFilter) {
    categoryFilter.value = savedFilter;
    filterQuotes();
  }
}

// ---- filter quotes ----
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(FILTER_KEY, selected);

  let filtered = quotes;
  if (selected !== "all") {
    filtered = quotes.filter(q => q.category === selected);
  }

  renderQuoteList(filtered);
}

// ---- display logic ----
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available.";
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }

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
                            <p class="category">— ${escapeHtml(q.category)}</p>`;
  sessionStorage.setItem(SESSION_KEY, idx);
}

// escape HTML helper
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---- render all quotes ----
function renderQuoteList(quotesToShow = quotes) {
  quoteList.innerHTML = "";

  if (quotesToShow.length === 0) {
    quoteList.innerHTML = "<p>No quotes to show.</p>";
    return;
  }

  quotesToShow.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "quote-item";
    item.innerHTML = `
      <div style="flex:1">
        <div class="quote-text">"${escapeHtml(q.text)}"</div>
        <div class="category">— ${escapeHtml(q.category)}</div>
      </div>
      <div class="quote-actions">
        <button class="remove-btn" data-index="${i}">Remove</button>
      </div>
    `;
    quoteList.appendChild(item);
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = parseInt(e.target.dataset.index, 10);
      removeQuote(idx);
    });
  });
}

// ---- add / remove ----
function addQuote() {
  const text = quoteInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    showMessage("Please fill both fields.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  quoteInput.value = "";
  categoryInput.value = "";

  populateCategories();
  filterQuotes();
  showMessage("Quote added!");
}

function removeQuote(index) {
  quotes.splice(index, 1);
  saveQuotes();
  populateCategories();
  filterQuotes();
}

// ---- import/export ----
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importFromJsonFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      filterQuotes();
      showMessage("Quotes imported successfully!");
    } catch (err) {
      showMessage("Invalid JSON file!");
    }
  };
  reader.readAsText(file);
}

// ---- init ----
function init() {
  populateCategories();
  filterQuotes();
  showRandomQuote();
}

// ---- event listeners ----
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportToJson);
importFile.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) importFromJsonFile(file);
});
categoryFilter.addEventListener("change", filterQuotes);

init();
