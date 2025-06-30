let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categorySet = new Set(quotes.map(quote => quote.category));
  const categoryFilter = document.getElementById("categoryFilter");

  // Clear existing categories first
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  categorySet.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function showRandomQuote() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  let filteredQuotes = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes available for this category.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <blockquote>"${quote.text}"</blockquote>
    <p><em>Category: ${quote.category}</em></p>
  `;

  sessionStorage.setItem("lastViewedQuoteIndex", randomIndex);
}

function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please fill in both the quote and category fields.");
    return;
  }

  const newQuote = { text: newText, category: newCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories(); // Update categories dropdown with new category

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added successfully!");
}

function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON: Expected an array of quotes");
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert('Quotes imported successfully!');
    } catch (error) {
      alert("Error importing quotes: " + error.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const filteredQuotes = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes available for this category.</p>";
    return;
  }

  const quoteList = filteredQuotes.map(q => `<li>"${q.text}" <em>[${q.category}]</em></li>`).join("");
  document.getElementById("quoteDisplay").innerHTML = `<ul>${quoteList}</ul>`;
}

document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Populate categories and restore last selected filter on load
window.onload = function() {
  populateCategories();

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    document.getElementById("categoryFilter").value = savedCategory;
  }
  filterQuotes();
};

const serverUrl = "https://jsonplaceholder.typicode.com/posts"; // Placeholder API for simulation

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(serverUrl);
    if (!response.ok) throw new Error("Failed to fetch from server");

    const serverData = await response.json();
    const fetchedQuotes = serverData.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    resolveConflicts(fetchedQuotes);

  } catch (error) {
    console.error("Error fetching quotes:", error.message);
  }
}

function resolveConflicts(serverQuotes) {
  // Check for duplicates or discrepancies
  let conflicts = false;
  serverQuotes.forEach(serverQuote => {
    const exists = quotes.some(localQuote => localQuote.text === serverQuote.text);
    if (!exists) {
      quotes.push(serverQuote);
      conflicts = true;
    }
  });

  if (conflicts) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    notifyUser("New quotes from server have been synced!");
  }
}

function notifyUser(message) {
  const notification = document.createElement("div");
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = "#28a745";
  notification.style.color = "white";
  notification.style.padding = "10px";
  notification.style.borderRadius = "5px";
  notification.innerText = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

window.onload = function() {
  populateCategories();

  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    document.getElementById("categoryFilter").value = savedCategory;
  }
  filterQuotes();

  // Sync with "server" every 60 seconds
  setInterval(fetchQuotesFromServer, 60000);
};
