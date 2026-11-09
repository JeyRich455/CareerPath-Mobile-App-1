
"use strict";

// CareerPath Mobile Application
// Source: New York State Occupational Wage Data

const CSV_PATH = "Data/careers.csv";

let careers = [];

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const resetBtn = document.getElementById("resetBtn");
const careerList = document.getElementById("careerList");
const resultCount = document.getElementById("resultCount");

// Read CSV text, including quoted values containing commas.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !inQuotes
    ) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }

      row.push(value.trim());

      if (row.some(cell => cell !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());

  if (row.some(cell => cell !== "")) {
    rows.push(row);
  }

  return rows;
}

// Convert salary and employment strings into numbers.
function toNumber(value) {
  const cleaned = String(value ?? "")
    .replace(/[$,]/g, "")
    .trim();

  if (!cleaned) return null;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

// Format annual wages as US dollars.
function formatMoney(value) {
  if (value === null) return "Not available";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

// Format employment counts.
function formatNumber(value) {
  if (value === null) return "Not available";
  return value.toLocaleString("en-US");
}

// Classify careers using their SOC occupation codes.
function getCategory(code) {
  const group = code.substring(0, 2);

  const categories = {
    "11": "Management",
    "13": "Business and Finance",
    "15": "Technology",
    "17": "Engineering",
    "19": "Science",
    "21": "Community Services",
    "23": "Legal",
    "25": "Education",
    "27": "Arts and Media",
    "29": "Healthcare",
    "31": "Healthcare Support",
    "33": "Public Safety",
    "35": "Food Services",
    "37": "Maintenance",
    "39": "Personal Services",
    "41": "Sales",
    "43": "Office Administration",
    "45": "Agriculture",
    "47": "Construction",
    "49": "Installation and Repair",
    "51": "Production",
    "53": "Transportation"
  };

  return categories[group] || "Other Careers";
}

// Convert the CSV rows into career objects.
function loadRecords(text) {
  const rows = parseCSV(text);

  if (rows.length < 2) {
    throw new Error("The CSV file has no career records.");
  }

  const headers = rows[0].map(header =>
    header.replace(/^\uFEFF/, "").trim()
  );

  const required = [
    "Area Name",
    "Standard Occupational Code",
    "Occupational Title",
    "Employment",
    "Mean Wage",
    "Median Wage",
    "Entry Wage",
    "Experienced Wage"
  ];

  for (const column of required) {
    if (!headers.includes(column)) {
      throw new Error("Missing CSV column: " + column);
    }
  }

  const records = rows.slice(1).map(row => {
    const data = {};

    headers.forEach((header, index) => {
      data[header] = row[index] || "";
    });

    return {
      area: data["Area Name"],
      code: data["Standard Occupational Code"],
      title: data["Occupational Title"],
      employment: toNumber(data["Employment"]),
      meanWage: toNumber(data["Mean Wage"]),
      medianWage: toNumber(data["Median Wage"]),
      entryWage: toNumber(data["Entry Wage"]),
      experiencedWage: toNumber(data["Experienced Wage"]),
      category: getCategory(
        data["Standard Occupational Code"]
      )
    };
  });

  return records.filter(career =>
    career.title &&
    career.code &&
    career.medianWage !== null
  );
}

// Create the category dropdown options.
function populateCategories() {
  const categories = [
    ...new Set(careers.map(career => career.category))
  ].sort();

  categoryFilter.innerHTML =
    '<option value="all">All Categories</option>';

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Create a labeled detail row safely.
function createDetail(label, value) {
  const item = document.createElement("li");
  item.textContent = `${label}: ${value}`;
  return item;
}

// Create an individual career card.
function createCareerCard(career) {
  const card = document.createElement("article");
  card.className = "career-card";

  const title = document.createElement("h3");
  title.textContent = career.title;

  const category = document.createElement("p");
  category.className = "category";
  category.textContent = career.category;

  const salary = document.createElement("p");
  salary.className = "salary";
  salary.textContent = formatMoney(career.medianWage);

  const salaryLabel = document.createElement("p");
  salaryLabel.textContent = "Median Annual Wage";

  const details = document.createElement("details");

  const summary = document.createElement("summary");
  summary.textContent = "View Career Details";

  const list = document.createElement("ul");

  list.append(
    createDetail("Area", career.area),
    createDetail("SOC Code", career.code),
    createDetail(
      "Employment",
      formatNumber(career.employment)
    ),
    createDetail(
      "Mean Wage",
      formatMoney(career.meanWage)
    ),
    createDetail(
      "Entry Wage",
      formatMoney(career.entryWage)
    ),
    createDetail(
      "Experienced Wage",
      formatMoney(career.experiencedWage)
    )
  );

  details.append(summary, list);

  card.append(
    title,
    category,
    salary,
    salaryLabel,
    details
  );

  return card;
}

// Search, filter, sort, and display careers.
function displayCareers() {
  const search = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;
  const sort = sortFilter.value;

  let filtered = careers.filter(career => {
    const matchesSearch =
      career.title.toLowerCase().includes(search);

    const matchesCategory =
      category === "all" ||
      career.category === category;

    return matchesSearch && matchesCategory;
  });

  if (sort === "high") {
    filtered.sort((a, b) =>
      b.medianWage - a.medianWage
    );
  } else if (sort === "low") {
    filtered.sort((a, b) =>
      a.medianWage - b.medianWage
    );
  } else if (sort === "az") {
    filtered.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }

  careerList.replaceChildren();

  resultCount.textContent =
    `Showing ${filtered.length} of ${careers.length} careers`;

  if (filtered.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No matching careers found.";
    careerList.appendChild(message);
    return;
  }

  filtered.forEach(career => {
    careerList.appendChild(createCareerCard(career));
  });
}

// Load the 20 records from the local CSV file.
async function initializeApp() {
  try {
    const response = await fetch(CSV_PATH);

    if (!response.ok) {
      throw new Error(
        `CSV loading failed: HTTP ${response.status}`
      );
    }

    const csvText = await response.text();

    careers = loadRecords(csvText);

    populateCategories();
    displayCareers();

    console.log(
      `CareerPath loaded ${careers.length} careers.`
    );
  } catch (error) {
    console.error("CareerPath error:", error);

    resultCount.textContent =
      "Unable to load career information.";

    careerList.textContent =
      "Check the CSV file location and run the app " +
      "using a local web server.";
  }
}

// Handle user interactions.
searchInput.addEventListener("input", displayCareers);
categoryFilter.addEventListener("change", displayCareers);
sortFilter.addEventListener("change", displayCareers);

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  sortFilter.value = "default";
  displayCareers();
});

// Start the application.
initializeApp();
