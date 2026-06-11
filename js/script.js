let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

let editingId = null;

let activeFilters = { category: "", from: "", to: "" };

const CATEGORY_COLORS = {
    Food:          "#f59e0b",
    Transport:     "#3b82f6",
    Shopping:      "#ec4899",
    Utilities:     "#10b981",
    Health:        "#ef4444",
    Education:     "#8b5cf6",
    Entertainment: "#f97316",
    Other:         "#6b7280",
};

const expenseForm     = document.getElementById("expenseForm");
const titleInput      = document.getElementById("title");
const amountInput     = document.getElementById("amount");
const categoryInput   = document.getElementById("category");
const dateInput       = document.getElementById("date");
const notesInput      = document.getElementById("notes");
const submitBtn       = document.getElementById("submitBtn");
const cancelBtn       = document.getElementById("cancelBtn");

const expenseTableBody = document.getElementById("expenseTableBody");
const resultCount      = document.getElementById("resultCount");

const filterCategory  = document.getElementById("filterCategory");
const filterFrom      = document.getElementById("filterFrom");
const filterTo        = document.getElementById("filterTo");
const applyFilterBtn  = document.getElementById("applyFilterBtn");
const clearFilterBtn  = document.getElementById("clearFilterBtn");

let chartInstance = null; 

document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

        link.classList.add("active");

        const section = link.dataset.section;
        document.getElementById("page-" + section).classList.add("active");

       
        if (section === "summary") {
            renderChart();
            updateSummaryStats();
        }
    });
});


expenseForm.addEventListener("submit", function(e) {
    e.preventDefault(); 

    if (!validateForm()) return;

    const title    = titleInput.value.trim();
    const amount   = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date     = dateInput.value;
    const notes    = notesInput.value.trim();

    if (editingId !== null) {
       
        const index = expenses.findIndex(exp => exp.id === editingId);
        
        expenses[index] = {
            ...expenses[index],
            title,
            amount,
            category,
            date,
            notes,
        };

        editingId = null;
        submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Add Expense`;
        cancelBtn.style.display = "none";
        showToast("Expense updated successfully!", "success");

    } else {
        
        const newExpense = {
            id:       Date.now(),
            title,
            amount,
            category,
            date,
            notes,
        };

        expenses.push(newExpense);
        showToast("Expense added!", "success");
    }

    saveToLocalStorage();
    expenseForm.reset();
    clearValidationErrors();
    updateSidebarTotal();
    renderExpenses();
});


cancelBtn.addEventListener("click", () => {
    editingId = null;
    expenseForm.reset();
    clearValidationErrors();
    submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Add Expense`;
    cancelBtn.style.display = "none";
});

function validateForm() {
    let isValid = true;

    clearValidationErrors();

    if (!titleInput.value.trim()) {
        showFieldError("title", "Title is required");
        isValid = false;
    }

    const amountVal = parseFloat(amountInput.value);
    if (!amountInput.value || isNaN(amountVal) || amountVal <= 0) {
        showFieldError("amount", "Enter a valid positive amount");
        isValid = false;
    }

    if (!categoryInput.value) {
        showFieldError("category", "Please select a category");
        isValid = false;
    }

    if (!dateInput.value) {
        showFieldError("date", "Please select a date");
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + "Error");

    input.classList.add("invalid");   
    if (errorEl) errorEl.textContent = message;
}

function clearValidationErrors() {
    ["title", "amount", "category", "date"].forEach(id => {
        const input = document.getElementById(id);
        const errorEl = document.getElementById(id + "Error");
        if (input) input.classList.remove("invalid");
        if (errorEl) errorEl.textContent = "";
    });
}

[titleInput, amountInput, categoryInput, dateInput].forEach(input => {
    input.addEventListener("input", () => {
        input.classList.remove("invalid");
        const errorEl = document.getElementById(input.id + "Error");
        if (errorEl) errorEl.textContent = "";
    });
});


applyFilterBtn.addEventListener("click", () => {
    activeFilters.category = filterCategory.value;
    activeFilters.from     = filterFrom.value;
    activeFilters.to       = filterTo.value;
    renderExpenses();
});

clearFilterBtn.addEventListener("click", () => {
    filterCategory.value = "";
    filterFrom.value     = "";
    filterTo.value       = "";
    activeFilters        = { category: "", from: "", to: "" };
    renderExpenses();
});

function getFilteredExpenses() {
    return expenses.filter(exp => {
        if (activeFilters.category && exp.category !== activeFilters.category) {
            return false;
        }
        
        if (activeFilters.from && exp.date < activeFilters.from) return false;
        if (activeFilters.to   && exp.date > activeFilters.to)   return false;

        return true; 
    });
}


function renderExpenses() {
    expenseTableBody.innerHTML = ""; 

    const filtered = getFilteredExpenses().sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    resultCount.textContent = activeFilters.category || activeFilters.from || activeFilters.to
        ? `Showing ${filtered.length} of ${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`
        : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <p>${expenses.length === 0 ? "No expenses yet. Add your first one!" : "No expenses match the selected filters."}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(exp => {
        const row = document.createElement("tr");

        const badgeClass = "badge-" + exp.category.toLowerCase();

        row.innerHTML = `
            <td>${escapeHtml(exp.title)}</td>
            <td class="amount-cell">Rs. ${exp.amount.toLocaleString()}</td>
            <td>
                <span class="category-badge ${badgeClass}">
                    ${exp.category}
                </span>
            </td>
            <td>${formatDate(exp.date)}</td>
            <td class="notes-cell" title="${escapeHtml(exp.notes || "")}">${escapeHtml(exp.notes || "—")}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-id="${exp.id}">Edit</button>
                    <button class="delete-btn" data-id="${exp.id}">Delete</button>
                </div>
            </td>
        `;

        row.querySelector(".edit-btn").addEventListener("click", () => editExpense(exp.id));
        row.querySelector(".delete-btn").addEventListener("click", () => deleteExpense(exp.id));

        expenseTableBody.appendChild(row);
    });
}


function editExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    titleInput.value    = exp.title;
    amountInput.value   = exp.amount;
    categoryInput.value = exp.category;
    dateInput.value     = exp.date;
    notesInput.value    = exp.notes || "";

    editingId = id;

    submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Update Expense`;
    cancelBtn.style.display = "inline-flex";

    document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-section="form"]').classList.add("active");
    document.getElementById("page-form").classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
}


function deleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    expenses = expenses.filter(exp => exp.id !== id);

    saveToLocalStorage();
    updateSidebarTotal();
    renderExpenses();
    showToast("Expense deleted.", "error");
}


function updateSummaryStats() {
    // Reduce adds up all amounts: starts at 0, adds each amount
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = expenses.length;
    const avg   = count > 0 ? total / count : 0;

    // Find the category with the highest total spending
    const categoryTotals = getCategoryTotals();
    const topCategory = Object.keys(categoryTotals).sort(
        (a, b) => categoryTotals[b] - categoryTotals[a]
    )[0] || "—";

    document.getElementById("statTotal").textContent = "Rs. " + total.toLocaleString();
    document.getElementById("statCount").textContent = count;
    document.getElementById("statAvg").textContent   = "Rs. " + Math.round(avg).toLocaleString();
    document.getElementById("statTop").textContent   = topCategory;
}

function updateSidebarTotal() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById("sidebarTotal").textContent = "Rs. " + total.toLocaleString();
}


function renderChart() {
    const totals = getCategoryTotals();
    const labels = Object.keys(totals);
    const values = Object.values(totals);
    const colors = labels.map(l => CATEGORY_COLORS[l] || "#6b7280");

    const ctx = document.getElementById("expenseChart").getContext("2d");

   
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (labels.length === 0) {
        document.getElementById("expenseChart").parentElement.innerHTML =
            `<p class="no-chart-msg">Add some expenses to see the chart.</p>`;
        document.getElementById("chartLegend").innerHTML = "";
        return;
    }

    chartInstance = new Chart(ctx, {
        type: "doughnut",  
        data: {
            labels,
            datasets: [{
                data:             values,
                backgroundColor:  colors,
                borderColor:      "#ffffff",
                borderWidth:      3,
                hoverOffset:      6,
            }]
        },
        options: {
            responsive: true,
            cutout: "62%",
            plugins: {
                legend: { display: false }, 
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed;
                            const pct = ((val / values.reduce((a,b)=>a+b,0))*100).toFixed(1);
                            return ` Rs. ${val.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    const legendEl = document.getElementById("chartLegend");
    legendEl.innerHTML = labels.map((label, i) => `
        <div class="legend-item">
            <div class="legend-dot" style="background:${colors[i]}"></div>
            <span>${label}: <strong>Rs. ${values[i].toLocaleString()}</strong></span>
        </div>
    `).join("");
}

function getCategoryTotals() {
    const totals = {};
    expenses.forEach(exp => {
        totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    return totals;
}


function saveToLocalStorage() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}



function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast " + type + " show";

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}



function escapeHtml(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-PK", {
        year:  "numeric",
        month: "short",
        day:   "numeric",
    });
}



(function init() {
    updateSidebarTotal();
    renderExpenses();
})();
