// --- Configuration & Constants ---
const CATEGORIES = {
    Food: { icon: 'fa-utensils', color: '#F87171', budget: 12000, brands: ['Swiggy', 'Zomato', 'Blinkit', 'Lunch', 'Dinner', 'Coffee'] },
    Transport: { icon: 'fa-car', color: '#FBBF24', budget: 5000, brands: ['Uber', 'Ola', 'Metro', 'Fuel', 'Auto'] },
    Shopping: { icon: 'fa-shopping-bag', color: '#818CF8', budget: 8000, brands: ['Amazon', 'Myntra', 'Reliance Digital', 'Groceries'] },
    Health: { icon: 'fa-heartbeat', color: '#34D399', budget: 3000, brands: ['Pharmacy', 'Apollo', 'Gym', 'Checkup'] },
    Bills: { icon: 'fa-file-invoice-dollar', color: '#60A5FA', budget: 10000, brands: ['Electricity', 'Rent', 'Internet', 'Mobile Recharage'] },
    Entertainment: { icon: 'fa-film', color: '#F472B6', budget: 4000, brands: ['Netflix', 'Cinema', 'Gaming', 'Hotstar'] },
    Other: { icon: 'fa-box', color: '#94A3B8', budget: 3000, brands: ['Gift', 'Donation', 'Cash Withdrawal'] }
};

const PAYMENT_METHODS = ['UPI', 'Card', 'Cash'];

// --- State ---
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentView = 'weekly'; // daily, weekly, monthly
let referenceDate = new Date();
let selectedModalCategory = 'Food';

// --- DOM Elements ---
const elements = {
    list: document.getElementById('list'),
    form: document.getElementById('form'),
    text: document.getElementById('text'),
    amount: document.getElementById('amount'),
    paymentMethod: document.getElementById('payment-method'),
    periodLabel: document.getElementById('period-label'),
    totalSpent: document.getElementById('total-spent'),
    avgSpent: document.getElementById('avg-spent'),
    txCount: document.getElementById('tx-count'),
    budgetPercentText: document.getElementById('budget-percent-text'),
    budgetPercentInner: document.getElementById('budget-percent-inner'),
    budgetRing: document.getElementById('budget-ring'),
    budgetStatus: document.getElementById('budget-status'),
    segmentedBar: document.getElementById('category-segmented-bar'),
    legend: document.getElementById('category-legend'),
    trendChart: document.getElementById('trend-chart'),
    budgetList: document.getElementById('budget-list'),
    modal: document.getElementById('modal-overlay'),
    openModalBtn: document.getElementById('open-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    catOptions: document.querySelectorAll('.cat-option')
};

// --- Initialization ---
function init() {
    if (transactions.length === 0) seedSampleData();
    setupEventListeners();
    render();
}

function seedSampleData() {
    const today = new Date();
    const cats = Object.keys(CATEGORIES);
    
    // Seed 35 days
    for (let i = 0; i < 35; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        const count = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < count; j++) {
            const catKey = cats[Math.floor(Math.random() * cats.length)];
            const cat = CATEGORIES[catKey];
            transactions.push({
                id: Math.floor(Math.random() * 10000000),
                text: cat.brands[Math.floor(Math.random() * cat.brands.length)],
                amount: Math.floor(Math.random() * 1200) + 100,
                category: catKey,
                date: date.toISOString(),
                paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)]
            });
        }
    }
    save();
}

// --- Logic ---

function getPeriodTransactions() {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        if (currentView === 'daily') return tDate.toDateString() === referenceDate.toDateString();
        if (currentView === 'weekly') {
            const start = getStartOfWeek(referenceDate);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            return tDate >= start && tDate < end;
        }
        return tDate.getMonth() === referenceDate.getMonth() && tDate.getFullYear() === referenceDate.getFullYear();
    });
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function render() {
    const data = getPeriodTransactions();
    updateHeader();
    updateMetrics(data);
    renderInsights(data);
    renderActivity(data);
}

function updateHeader() {
    let label = '';
    if (currentView === 'daily') {
        label = referenceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (currentView === 'weekly') {
        const start = getStartOfWeek(referenceDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        label = `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    } else {
        label = referenceDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    elements.periodLabel.innerText = label;
}

function updateMetrics(data) {
    const total = data.reduce((s, t) => s + t.amount, 0);
    const avg = data.length > 0 ? total / data.length : 0;
    
    elements.totalSpent.innerText = `₹${total.toLocaleString('en-IN')}`;
    elements.avgSpent.innerText = `₹${Math.round(avg).toLocaleString('en-IN')}`;
    elements.txCount.innerText = data.length;

    // Budget Ring
    const multiplier = currentView === 'daily' ? 1/30 : currentView === 'weekly' ? 1/4 : 1;
    const totalLimit = Object.values(CATEGORIES).reduce((s, c) => s + c.budget, 0) * multiplier;
    const percent = Math.min(Math.round((total / totalLimit) * 100), 120);
    
    elements.budgetPercentText.innerText = `${percent}%`;
    elements.budgetPercentInner.innerText = `${percent}%`;
    
    // Circular ring math: stroke-dasharray is 163.36 (2 * PI * 26)
    const offset = 163.36 - (Math.min(percent, 100) / 100) * 163.36;
    elements.budgetRing.style.strokeDashoffset = offset;
    
    const color = percent > 100 ? 'var(--accent-red)' : percent > 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    elements.budgetRing.style.stroke = color;
    elements.budgetStatus.innerText = percent > 100 ? 'Over Limit!' : percent > 80 ? 'Near Limit' : 'Within Limit';
    elements.budgetStatus.style.color = color;
}

function renderInsights(data) {
    const catTotals = {};
    data.forEach(t => catTotals[t.category] = (catTotals[t.category] || 0) + t.amount);
    const total = Object.values(catTotals).reduce((s, v) => s + v, 0) || 1;

    // 1. Segmented Bar
    elements.segmentedBar.innerHTML = Object.keys(CATEGORIES).map(cat => {
        const val = catTotals[cat] || 0;
        const p = (val / total) * 100;
        if (p === 0) return '';
        return `<div class="segment" style="width: ${p}%; background: ${CATEGORIES[cat].color}" data-label="${cat}: ${Math.round(p)}%"></div>`;
    }).join('');

    // 2. Legend
    elements.legend.innerHTML = Object.keys(CATEGORIES).map(cat => `
        <div class="legend-item">
            <div class="dot" style="background: ${CATEGORIES[cat].color}"></div>
            <span>${cat}</span>
        </div>
    `).join('');

    // 3. Trend Chart
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(referenceDate);
        if (currentView === 'daily') d.setDate(d.getDate() - i);
        else if (currentView === 'weekly') d.setDate(d.getDate() - (i * 7));
        else d.setMonth(d.getMonth() - i);
        
        const label = currentView === 'daily' ? d.getDate() : currentView === 'weekly' ? 'W' + (i + 1) : d.toLocaleDateString('en-IN', { month: 'short' });
        
        const dayTotal = transactions.filter(t => {
            const tDate = new Date(t.date);
            if (currentView === 'daily') return tDate.toDateString() === d.toDateString();
            if (currentView === 'weekly') {
                const s = getStartOfWeek(d);
                const e = new Date(s); e.setDate(s.getDate() + 7);
                return tDate >= s && tDate < e;
            }
            return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
        }).reduce((s, t) => s + t.amount, 0);
        
        trendData.push({ label, val: dayTotal });
    }

    const max = Math.max(...trendData.map(d => d.val), 1);
    elements.trendChart.innerHTML = trendData.map(d => `
        <div class="trend-col">
            <div class="trend-bar-group">
                <div class="trend-segment" style="height: ${(d.val / max) * 100}%; background: var(--accent-emerald)"></div>
            </div>
            <span class="trend-label">${d.label}</span>
        </div>
    `).join('');

    // 4. Budget Progress
    const mult = currentView === 'daily' ? 1/30 : currentView === 'weekly' ? 1/4 : 1;
    elements.budgetList.innerHTML = Object.keys(CATEGORIES).map(catKey => {
        const spent = catTotals[catKey] || 0;
        const limit = CATEGORIES[catKey].budget * mult;
        const p = Math.min((spent / limit) * 100, 100);
        const color = p > 100 ? 'var(--accent-red)' : p > 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
        return `
            <div class="budget-row">
                <div class="budget-info">
                    <div class="budget-cat">
                        <i class="fas ${CATEGORIES[catKey].icon}" style="color: ${CATEGORIES[catKey].color}"></i>
                        <span>${catKey}</span>
                    </div>
                    <div class="budget-amount">₹${spent.toLocaleString()} / <b>₹${Math.round(limit).toLocaleString()}</b></div>
                </div>
                <div class="progress-bar-outer">
                    <div class="progress-bar-inner" style="width: ${p}%; background: ${color}"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderActivity(data) {
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    elements.list.innerHTML = sorted.map(t => `
        <li class="transaction-item animate-entry">
            <div class="t-left">
                <div class="t-icon" style="background: ${CATEGORIES[t.category].color}20; color: ${CATEGORIES[t.category].color}">
                    <i class="fas ${CATEGORIES[t.category].icon}"></i>
                </div>
                <div class="t-details">
                    <h4>${t.text}</h4>
                    <p>${new Date(t.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})} • <span class="t-badge">${t.paymentMethod}</span></p>
                </div>
            </div>
            <div class="t-right">
                <div class="t-amount">-₹${t.amount.toLocaleString()}</div>
            </div>
        </li>
    `).join('');
}

// --- Events ---

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            currentView = t.dataset.view;
            referenceDate = new Date();
            render();
        });
    });

    // Navigation
    document.getElementById('prev-period').addEventListener('click', () => {
        if (currentView === 'daily') referenceDate.setDate(referenceDate.getDate() - 1);
        else if (currentView === 'weekly') referenceDate.setDate(referenceDate.getDate() - 7);
        else referenceDate.setMonth(referenceDate.getMonth() - 1);
        render();
    });

    document.getElementById('next-period').addEventListener('click', () => {
        if (currentView === 'daily') referenceDate.setDate(referenceDate.getDate() + 1);
        else if (currentView === 'weekly') referenceDate.setDate(referenceDate.getDate() + 7);
        else referenceDate.setMonth(referenceDate.getMonth() + 1);
        render();
    });

    // Modal
    elements.openModalBtn.addEventListener('click', () => elements.modal.classList.add('active'));
    elements.closeModalBtn.addEventListener('click', () => elements.modal.classList.remove('active'));
    
    elements.catOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            elements.catOptions.forEach(x => x.classList.remove('selected'));
            opt.classList.add('selected');
            selectedModalCategory = opt.dataset.value;
        });
    });

    elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = elements.text.value.trim();
        const amt = parseFloat(elements.amount.value);
        if (!desc || isNaN(amt)) return;

        transactions.push({
            id: Date.now(),
            text: desc,
            amount: amt,
            category: selectedModalCategory,
            date: new Date().toISOString(),
            paymentMethod: elements.paymentMethod.value
        });

        save();
        render();
        
        // Visual feedback
        elements.openModalBtn.style.transform = 'scale(1.2)';
        setTimeout(() => elements.openModalBtn.style.transform = '', 300);

        elements.modal.classList.remove('active');
        elements.text.value = '';
        elements.amount.value = '';
    });
}

function save() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

init();
