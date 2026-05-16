// --- Configuration & Data ---
const state = {
    balance: 124580,
    savings: 18450,
    savingsRate: 14.8,
    transactions: [
        { id: 1, name: 'Apple Store', meta: 'Electronics • 2:30 PM', amount: 89900, status: 'Success', icon: 'fa-laptop', color: '#00D4FF' },
        { id: 2, name: 'Starbucks', meta: 'Coffee • 11:15 AM', amount: 450, status: 'Success', icon: 'fa-coffee', color: '#00E676' },
        { id: 3, name: 'Freelance Pay', meta: 'Income • Yesterday', amount: 45000, status: 'Received', icon: 'fa-wallet', color: '#00D4FF' },
        { id: 4, name: 'Amazon', meta: 'Shopping • 12 May', amount: 2450, status: 'Success', icon: 'fa-shopping-bag', color: '#FF9900' }
    ],
    theme: 'dark'
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    renderTransactions();
    setupCharts();
    setupEventListeners();
}

// --- Renderers ---
function renderTransactions() {
    const list = document.getElementById('recent-tx-list');
    list.innerHTML = state.transactions.map(t => `
        <div class="t-row animate">
            <div class="t-info">
                <div class="t-icon" style="background: ${t.color}15; color: ${t.color}">
                    <i class="fas ${t.icon}"></i>
                </div>
                <div class="t-details">
                    <span class="t-name">${t.name}</span>
                    <span class="t-meta">${t.meta}</span>
                </div>
            </div>
            <div class="t-amount">
                <span class="t-val">₹${t.amount.toLocaleString()}</span>
                <span class="t-status" style="color: ${t.status === 'Received' ? 'var(--accent-green)' : 'var(--text-secondary)'}">${t.status}</span>
            </div>
        </div>
    `).join('');
}

// --- Charting ---
function setupCharts() {
    drawDonutChart('budget-donut', 0.72, '#00D4FF');
    drawLineChart('trend-line-chart', [30, 45, 35, 60, 40, 80, 55], '#00D4FF');
}

function drawDonutChart(canvasId, percent, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 100;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const x = size / 2;
    const y = size / 2;
    const radius = 40;

    // Background track
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Progress
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, (-Math.PI / 2) + (percent * 2 * Math.PI));
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function drawLineChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 10;
    
    ctx.clearRect(0, 0, width, height);

    // Create Path
    ctx.beginPath();
    const step = (width - padding * 2) / (data.length - 1);
    
    data.forEach((val, i) => {
        const x = padding + (i * step);
        const y = height - padding - (val / 100 * (height - padding * 2));
        if (i === 0) ctx.moveTo(x, y);
        else {
            const prevX = padding + ((i-1) * step);
            const prevY = height - padding - (data[i-1] / 100 * (height - padding * 2));
            const cpX1 = prevX + step / 2;
            const cpY1 = prevY;
            const cpX2 = prevX + step / 2;
            const cpY2 = y;
            ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
        }
    });

    // Stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Gradient Fill
    ctx.lineTo(width - padding, height);
    ctx.lineTo(padding, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.fill();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Appearance Sheet
    const appearanceBtn = document.getElementById('open-appearance');
    const appearanceSheet = document.getElementById('appearance-sheet');
    
    appearanceBtn.onclick = () => appearanceSheet.classList.add('active');
    
    appearanceSheet.onclick = (e) => {
        if (e.target === appearanceSheet) appearanceSheet.classList.remove('active');
    };

    // Theme Options
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        opt.onclick = () => {
            const theme = opt.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
            themeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            
            // Redraw charts for theme-specific colors if needed
            setupCharts();
        };
    });

    // Nav Items
    const navItems = document.querySelectorAll('.nav-item:not(.fab-center)');
    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        };
    });
}
