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
/* --- Sync & Conflict Module for Dynamic Quote Generator --- */

// CONFIG: set your server endpoint here (must support GET /quotes and POST /quotes for a real server)
const SERVER_URL = "https://example.com/api/quotes"; // replace when you have a real API
const POLL_INTERVAL_MS = 30_000; // 30 seconds polling

// DOM refs for sync UI
const syncNowBtn = document.getElementById("syncNowBtn");
const syncStatus = document.getElementById("syncStatus");
const conflictArea = document.getElementById("conflictArea");
const conflictList = document.getElementById("conflictList");

// State for syncing
let syncing = false;

// Ensure each quote has an id and lastModified timestamp
// when creating quotes in your app, add:
// { id: "quote_12345", text: "...", category: "...", lastModified: Date.now() }
function ensureQuoteFields(q) {
  if (!q.id) q.id = `q_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  if (!q.lastModified) q.lastModified = Date.now();
  return q;
}

// Helper: load server quotes (try real fetch, otherwise use mock)
async function fetchQuotesFromServer() {
  try {
    const resp = await fetch(SERVER_URL, { method: "GET" });
    if (!resp.ok) throw new Error("Server responded " + resp.status);
    const data = await resp.json();
    // Expect server returns an array of quote objects
    return data.map(ensureQuoteFields);
  } catch (err) {
    console.warn("Fetch to real server failed — using mock server. Error:", err.message);
    // FALLBACK: return mock server data (simulate remote data)
    return mockServerGet();
  }
}

// Helper: push local changes to server (POST or PUT). For demo, we push all quotes.
async function pushLocalQuotesToServer(localQuotes) {
  try {
    const resp = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localQuotes)
    });
    if (!resp.ok) throw new Error("Server responded " + resp.status);
    const data = await resp.json();
    return data;
  } catch (err) {
    console.warn("Push to server failed — using mock server. Error:", err.message);
    return mockServerPost(localQuotes);
  }
}

/* -------------------------
   Conflict resolution rules
   - Server wins by default (server copy overwrites local)
   - We surface conflicts to the user so they can decide to KEEP LOCAL instead
   - Conflict defined when both have same id and different lastModified timestamps
   ------------------------- */

function detectConflicts(localArr, serverArr) {
  // Create maps by id
  const localMap = new Map(localArr.map(q => [q.id, q]));
  const serverMap = new Map(serverArr.map(q => [q.id, q]));

  const conflicts = [];

  for (const [id, serverQ] of serverMap) {
    if (localMap.has(id)) {
      const localQ = localMap.get(id);
      if (localQ.lastModified !== serverQ.lastModified && JSON.stringify(localQ) !== JSON.stringify(serverQ)) {
        // different, mark conflict
        conflicts.push({ id, local: localQ, server: serverQ });
      }
    }
  }

  return conflicts;
}

// Merge server into local (server takes precedence for conflicting items)
function mergeServerIntoLocal(localArr, serverArr) {
  const localMap = new Map(localArr.map(q => [q.id, q]));
  // replace or add server entries
  for (const s of serverArr) {
    localMap.set(s.id, s);
  }
  // convert back to array
  const merged = Array.from(localMap.values());
  // ensure consistent sort (optional)
  merged.sort((a,b) => (a.lastModified || 0) - (b.lastModified || 0));
  return merged;
}

// UI: show conflicts and allow manual choice
function showConflicts(conflicts) {
  if (!conflicts || conflicts.length === 0) {
    conflictArea.style.display = "none";
    conflictList.innerHTML = "";
    return;
  }

  conflictArea.style.display = "block";
  conflictList.innerHTML = "";

  conflicts.forEach((c, idx) => {
    const wrap = document.createElement("div");
    wrap.style.border = "1px solid #ddd";
    wrap.style.padding = "8px";
    wrap.style.marginBottom = "8px";
    wrap.innerHTML = `
      <div><strong>Quote ID:</strong> ${c.id}</div>
      <div style="margin-top:6px;">
        <div><strong>Local:</strong> "${escapeHtml(c.local.text)}" — <em>${escapeHtml(c.local.category)}</em></div>
        <div style="font-size:0.85rem;color:#666;">lastModified: ${new Date(c.local.lastModified).toLocaleString()}</div>
      </div>
      <div style="margin-top:6px;">
        <div><strong>Server:</strong> "${escapeHtml(c.server.text)}" — <em>${escapeHtml(c.server.category)}</em></div>
        <div style="font-size:0.85rem;color:#666;">lastModified: ${new Date(c.server.lastModified).toLocaleString()}</div>
      </div>
    `;

    // action buttons
    const actions = document.createElement("div");
    actions.style.marginTop = "8px";

    const acceptServerBtn = document.createElement("button");
    acceptServerBtn.textContent = "Accept Server";
    acceptServerBtn.style.marginRight = "8px";
    acceptServerBtn.addEventListener("click", () => {
      // accept server version: set local to server and re-save
      quotes = quotes.map(q => q.id === c.id ? c.server : q);
      saveQuotes();
      populateCategories?.(); // if your app has these functions
      filterQuotes?.();
      renderQuoteList?.();
      showConflicts(detectConflicts(quotes, serverSnapshot || []));
      showMessage("Accepted server version for that quote.");
    });

    const keepLocalBtn = document.createElement("button");
    keepLocalBtn.textContent = "Keep Local";
    keepLocalBtn.addEventListener("click", () => {
      // keep local: push local to server (attempt)
      pushLocalQuotesToServer(quotes).then(() => {
        showMessage("Kept local version and pushed to server (simulated).");
      }).catch(()=>{ showMessage("Could not push to server."); });
    });

    actions.appendChild(acceptServerBtn);
    actions.appendChild(keepLocalBtn);

    wrap.appendChild(actions);
    conflictList.appendChild(wrap);
  });
}

// Global to keep last server snapshot for conflict UI ; optional
let serverSnapshot = [];

// Main sync function: fetch, detect conflicts, merge (server wins), persist
async function syncWithServer(showNotifications = true) {
  if (syncing) return;
  syncing = true;
  syncStatus.textContent = "Syncing...";
  syncStatus.style.color = "#2b8cff";

  try {
    const serverQuotes = await fetchServerQuotes();
    serverSnapshot = serverQuotes;

    // detect conflicts
    const conflicts = detectConflicts(quotes, serverQuotes);
    if (conflicts.length > 0) {
      // show conflicts to user, but also perform default merge (server wins)
      showConflicts(conflicts);
    } else {
      // hide conflict area if none
      showConflicts([]);
    }

    // Merge server data (server takes precedence)
    const merged = mergeServerIntoLocal(quotes, serverQuotes);
    quotes = merged;
    saveQuotes();

    // optionally push local to server (if you want two-way sync). Here we push full set:
    // await pushLocalQuotesToServer(quotes);

    // update UI
    populateCategories?.();
    filterQuotes?.();
    renderQuoteList?.();

    if (showNotifications) {
      syncStatus.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
      syncStatus.style.color = "#333";
    }
  } catch (err) {
    console.error("Sync error:", err);
    syncStatus.textContent = "Sync failed";
    syncStatus.style.color = "crimson";
  } finally {
    syncing = false;
  }
}

// Periodic polling
let pollHandle = setInterval(() => {
  syncWithServer(false);
}, POLL_INTERVAL_MS);

// Manual Sync Now button
syncNowBtn.addEventListener("click", () => syncWithServer(true));

// OPTIONAL: call sync on app start
syncWithServer(true);

/* ---------------------------
   MOCK SERVER (for demo only)
   If you don't have a backend, these functions simulate server behavior.
   In production remove these and set SERVER_URL to your real API endpoint.
   --------------------------- */

const _mockServerStore = [
  { id: "q_server_1", text: "Server quote 1", category: "Server", lastModified: Date.now() - 600000 },
  { id: "q_server_2", text: "Server quote 2", category: "Server", lastModified: Date.now() - 300000 }
];

function mockServerGet() {
  // simulate network latency
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(_mockServerStore)));
    }, 500);
  });
}

function mockServerPost(localQuotes) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // naive merge behavior on server: take everything local and overwrite server store
      // For demo we append any new ones and update lastModified for duplicates
      const sMap = new Map(_mockServerStore.map(q => [q.id, q]));
      localQuotes.forEach(lq => {
        sMap.set(lq.id, { ...lq });
      });
      // replace server store
      const arr = Array.from(sMap.values());
      _mockServerStore.length = 0;
      _mockServerStore.push(...arr);
      resolve(arr);
    }, 500);
  });
}
