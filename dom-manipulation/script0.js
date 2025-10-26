// Step 1: Define an array of quote objects
let quotes = [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
];

// Step 2: Get DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const quoteInput = document.getElementById("newQuoteText");
const categoryInput = document.getElementById("newQuoteCategory");

// Step 3: Show a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <p class="category">— Category: ${randomQuote.category}</p>
  `;
}

// Step 4: Add a new quote dynamically
function addQuote() {
  const newText = quoteInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please fill in both fields before adding a quote.");
    return;
  }

  // Create new quote object and add to array
  const newQuoteObj = { text: newText, category: newCategory };
  quotes.push(newQuoteObj);

  // Optional: show the newly added quote immediately
  quoteDisplay.innerHTML = `
    <p>"${newQuoteObj.text}"</p>
    <p class="category">— Category: ${newQuoteObj.category}</p>
  `;

  // Clear input fields
  quoteInput.value = "";
  categoryInput.value = "";

  alert("New quote added successfully!");
}

// Step 5: Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);

// Step 6: Display one quote when page first loads
window.onload = showRandomQuote;
