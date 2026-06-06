/* ═══════════════════════════════════════════════════
   Mintro — Spend Smarter
   ═══════════════════════════════════════════════════ */

/* ─── Constants ──────────────────────────────────── */

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', emoji: '🍔', color: 'hsl(15, 80%, 55%)' },
  { id: 'transport', label: 'Transport', emoji: '🚗', color: 'hsl(220, 70%, 55%)' },
  { id: 'shopping', label: 'Shopping', emoji: '🛒', color: 'hsl(280, 60%, 55%)' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎉', color: 'hsl(50, 90%, 50%)' },
  { id: 'utilities', label: 'Utilities', emoji: '💡', color: 'hsl(200, 60%, 50%)' },
  { id: 'rent', label: 'Rent', emoji: '🏠', color: 'hsl(340, 70%, 50%)' },
  { id: 'health', label: 'Health', emoji: '❤️', color: 'hsl(150, 65%, 45%)' },
  { id: 'education', label: 'Education', emoji: '📚', color: 'hsl(190, 70%, 50%)' },
  { id: 'work', label: 'Work', emoji: '💼', color: 'hsl(260, 60%, 50%)' },
  { id: 'other', label: 'Other', emoji: '✨', color: 'hsl(0, 0%, 60%)' },
];

const DEFAULT_CATEGORY = 'other';
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const currencyFmt = new Intl.NumberFormat('en-NG', {
  style: 'currency', currency: 'NGN',
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: 'numeric', minute: '2-digit',
});

const dateOnlyFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});

const dailyLabelFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
});

/* ─── State ──────────────────────────────────────── */

const state = {
  expenses: [],
  budget: null,
  goals: [],
  goalSurplus: {},
  userName: 'Alexander',
  currentView: 'daily',
  selectedDate: new Date(),
  currentYear: new Date().getFullYear(),
  currentFilter: 'all',
  searchQuery: '',
  theme: 'light',
  selectedDay: null,
};

let nextExpenseId = 1;

/* ─── DOM Cache ──────────────────────────────────── */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const dom = {};

function cacheDom() {
  const ids = [
    'themeToggle', 'exportBtn', 'dashboard',
    'dashTotal', 'dashTotalSub', 'dashBudgetRemain', 'dashBudgetSub',
    'budgetRingFill',
    'dashStatus', 'dashStatusSub',
    'dashGoalName', 'dashGoalFill', 'dashGoalSub', 'dashGoalBar',
    'viewLabel', 'navPrev', 'navNext',
    'searchInput', 'filterTabs',
    'contentArea', 'viewContainer', 'emptyState',
    'expensePanel', 'panelBackdrop', 'panelSheet', 'panelClose', 'expenseForm',
    'expenseName', 'expenseAmount', 'expenseCategory', 'expenseDate', 'addBtn', 'formError', 'dateFieldGroup',
    'budgetPanel', 'budgetBackdrop', 'budgetPanelClose', 'budgetInput', 'saveBudgetBtn',
    'goalPanel', 'goalBackdrop', 'goalPanelClose', 'goalPanelTitle',
    'goalName', 'goalTarget', 'goalDate', 'saveGoalBtn', 'deleteGoalBtn',
    'fab', 'cardTotal', 'cardBudget', 'cardStatus', 'cardGoal',
    'userAvatar', 'userNameDisplay', 'welcomeText',
    'dashEditBudget', 'dashGoalAction',
  ];
  ids.forEach(id => { dom[id] = $(`#${id}`); });
  dom.viewPills = $$('.pill');
}

/* ─── Helpers ────────────────────────────────────── */

function fmtCurr(v) { return currencyFmt.format(v); }

function fmtDate(ts) { return dateFmt.format(new Date(ts)); }

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getCategory(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === DEFAULT_CATEGORY);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function getAllTotal(list) {
  return (list || state.expenses).reduce((s, e) => s + e.amount, 0);
}

function getFilteredExpenses() {
  let list = state.expenses;
  if (state.currentFilter !== 'all') {
    list = list.filter(e => e.category === state.currentFilter);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(q));
  }
  return list;
}

function getDayExpenses(dateStr) {
  return getFilteredExpenses().filter(e => e.date.startsWith(dateStr));
}

function getMonthExpenses(year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return getFilteredExpenses().filter(e => e.date.startsWith(prefix));
}

function getYearExpenses(year) {
  return getFilteredExpenses().filter(e => e.date.startsWith(String(year)));
}

function getMonthlyTotal(year, month) {
  return getAllTotal(getMonthExpenses(year, month));
}

function getCurrentMonthTotal() {
  const d = new Date();
  return getMonthlyTotal(d.getFullYear(), d.getMonth());
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/* ─── LocalStorage ───────────────────────────────── */

function saveState() {
  try {
    localStorage.setItem('coinwise_expenses', JSON.stringify(state.expenses));
    localStorage.setItem('coinwise_budget', JSON.stringify(state.budget));
    localStorage.setItem('coinwise_goals', JSON.stringify(state.goals));
    localStorage.setItem('coinwise_goalSurplus', JSON.stringify(state.goalSurplus));
    localStorage.setItem('coinwise_theme', state.theme);
  } catch (e) {}
}

function loadState() {
  try {
    const exp = localStorage.getItem('coinwise_expenses');
    if (exp) state.expenses = JSON.parse(exp);
    const bud = localStorage.getItem('coinwise_budget');
    if (bud) {
      const p = JSON.parse(bud);
      if (p.month === getMonthKey(new Date())) state.budget = p;
    }
    const gls = localStorage.getItem('coinwise_goals');
    if (gls) state.goals = JSON.parse(gls);
    const gs = localStorage.getItem('coinwise_goalSurplus');
    if (gs) state.goalSurplus = JSON.parse(gs);
    const th = localStorage.getItem('coinwise_theme');
    if (th) state.theme = th;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) state.theme = 'dark';
  } catch (e) {}
}

/* ─── Theme ──────────────────────────────────────── */

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  saveState();
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
  dom.themeToggle.classList.remove('theme-toggle--animating');
  void dom.themeToggle.offsetWidth;
  dom.themeToggle.classList.add('theme-toggle--animating');
}

/* ─── Panels ─────────────────────────────────────── */

function openPanel(name) {
  closePanels();
  const el = dom[name + 'Panel'];
  if (el) el.classList.add('side-panel--open');
}

function closePanels() {
  $$('.side-panel').forEach(p => p.classList.remove('side-panel--open'));
  dom.fab.classList.remove('fab--open');
}

function toggleExpensePanel() {
  if (dom.expensePanel.classList.contains('side-panel--open')) {
    closePanels();
  } else {
    dom.expenseDate.value = toDateStr(state.selectedDate);
    openPanel('expense');
    dom.fab.classList.add('fab--open');
    dom.expenseName.focus();
  }
}

/* ─── Expense CRUD ───────────────────────────────── */

function addExpense(name, amount, category, dateStr) {
  const expense = {
    id: genId(),
    name: name.trim(),
    amount,
    category,
    date: dateStr || new Date().toISOString(),
  };
  state.expenses.unshift(expense);
  saveState();
  renderAll();
}

function deleteExpense(id) {
  const item = dom.viewContainer.querySelector(`.expense-item[data-id="${id}"]`);
  if (item) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    item.classList.add('expense-item--removing');
    setTimeout(() => {
      item.remove();
      renderAll();
    }, 300);
  } else {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    renderAll();
  }
}

/* ─── Budget ─────────────────────────────────────── */

function saveBudget(amount) {
  if (!amount || amount <= 0) return;
  state.budget = { amount, month: getMonthKey(new Date()) };
  saveState();
  closePanels();
  renderAll();
}

function clearBudget() {
  state.budget = null;
  saveState();
  renderAll();
}

/* ─── Goals ──────────────────────────────────────── */

function saveGoal(name, target, targetDate) {
  if (!name.trim() || !target || target <= 0) return;
  const existing = state.goals[0];
  if (existing) {
    existing.name = name.trim();
    existing.targetAmount = target;
    existing.targetDate = targetDate || null;
  } else {
    state.goals.push({
      id: genId(),
      name: name.trim(),
      targetAmount: target,
      savedAmount: 0,
      targetDate: targetDate || null,
    });
  }
  saveState();
  closePanels();
  renderAll();
}

function deleteGoal() {
  state.goals = [];
  saveState();
  closePanels();
  renderAll();
}

function addToGoal(amount) {
  if (state.goals.length === 0 || !amount || amount <= 0) return;
  state.goals[0].savedAmount += amount;
  saveState();
  renderAll();
}

function getMonthlySurplus() {
  if (!state.budget) return 0;
  return Math.max(0, state.budget.amount - getCurrentMonthTotal());
}

/* ─── View Label & Navigation ────────────────────── */

function updateViewLabel() {
  const d = state.selectedDate;
  switch (state.currentView) {
    case 'daily':
      dom.viewLabel.textContent = dailyLabelFmt.format(d);
      break;
    case 'monthly':
      dom.viewLabel.textContent = `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
      break;
    case 'yearly':
      dom.viewLabel.textContent = `${state.currentYear}`;
      break;
  }
}

function navPrev() {
  switch (state.currentView) {
    case 'daily':
      state.selectedDate.setDate(state.selectedDate.getDate() - 1);
      break;
    case 'monthly':
      state.selectedDate.setMonth(state.selectedDate.getMonth() - 1);
      break;
    case 'yearly':
      state.currentYear--;
      break;
  }
  renderAll();
}

function navNext() {
  switch (state.currentView) {
    case 'daily':
      state.selectedDate.setDate(state.selectedDate.getDate() + 1);
      break;
    case 'monthly':
      state.selectedDate.setMonth(state.selectedDate.getMonth() + 1);
      break;
    case 'yearly':
      state.currentYear++;
      break;
  }
  renderAll();
}

/* ─── View Switcher ──────────────────────────────── */

function setView(view) {
  state.currentView = view;
  $$('.pill').forEach(p => {
    p.classList.toggle('pill--active', p.dataset.view === view);
  });
  if (view === 'yearly') {
    dom.navPrev.textContent = '‹';
    dom.navNext.textContent = '›';
  } else {
    dom.navPrev.textContent = '‹';
    dom.navNext.textContent = '›';
  }
  renderAll();
}

/* ─── Render: Calendar (Monthly) ────────────────── */

function renderMonthly() {
  const year = state.selectedDate.getFullYear();
  const month = state.selectedDate.getMonth();
  const today = new Date();
  const todayStr = toDateStr(today);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const selectedStr = toDateStr(state.selectedDate);

  const dailyBudget = state.budget ? state.budget.amount / daysInMonth : 0;

  let html = '<div class="calendar-grid">';
  WEEKDAYS.forEach(w => {
    html += `<div class="calendar-weekday">${w}</div>`;
  });

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day calendar-day--empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayExp = getDayExpenses(dateStr);
    const total = getAllTotal(dayExp);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedStr;

    let level = '';
    if (dayExp.length > 0 && dailyBudget > 0) {
      if (total > dailyBudget * 1.2) level = 'high';
      else if (total > dailyBudget * 0.8) level = 'med';
      else level = 'low';
    } else if (dayExp.length > 0) {
      level = 'low';
    }

    const classes = [
      'calendar-day',
      isToday ? 'calendar-day--today' : '',
      isSelected ? 'calendar-day--selected' : '',
      dayExp.length === 0 ? '' : '',
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" data-date="${dateStr}">
      <span>${d}</span>
      ${level ? `<span class="calendar-dot calendar-dot--${level}"></span>` : ''}
    </div>`;
  }

  html += '</div>';

  const selDay = getDayExpenses(selectedStr);
  const selTotal = getAllTotal(selDay);
  const displayDate = selectedStr.split('-').reverse().join('/');
  html += `<div class="calendar-summary">
    You spent <strong>${fmtCurr(selTotal)}</strong> on ${displayDate}
    ${selDay.length > 0 ? `(${selDay.length} expense${selDay.length > 1 ? 's' : ''})` : ''}
  </div>`;

  return html;
}

/* ─── Render: Daily ──────────────────────────────── */

function renderDaily() {
  const ds = toDateStr(state.selectedDate);
  const dayExp = getDayExpenses(ds);
  const total = getAllTotal(dayExp);

  let html = `<div class="daily-header">
    <span class="daily-header__title">Expenses on ${dailyLabelFmt.format(state.selectedDate)}</span>
    <span class="daily-total">${fmtCurr(total)}</span>
  </div>`;

  html += renderExpenseListHTML(dayExp);
  return html;
}

/* ─── Render: Yearly ─────────────────────────────── */

function renderYearly() {
  const year = state.currentYear;
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let monthlyTotals = [];
  for (let m = 0; m < 12; m++) {
    monthlyTotals.push(getMonthlyTotal(year, m));
  }
  const maxTotal = Math.max(...monthlyTotals, 1);

  let html = '<div class="yearly-grid">';
  for (let m = 0; m < 12; m++) {
    const total = monthlyTotals[m];
    const pct = (total / maxTotal) * 100;
    const isCurrent = m === currentMonth && year === currentYear;

    // Check if month exceeded budget
    let overBudget = false;
    if (state.budget) {
      const monthExp = getMonthExpenses(year, m);
      const monthTotal = getAllTotal(monthExp);
      overBudget = monthTotal > state.budget.amount;
    }

    html += `<div class="yearly-month ${isCurrent ? 'yearly-month--current' : ''}" data-year="${year}" data-month="${m}">
      <div class="yearly-month__name">${MONTHS_SHORT[m]}</div>
      <div class="yearly-month__amount">${fmtCurr(total)}
        ${overBudget ? '<span class="yearly-month__dot" style="background:var(--danger)"></span>' : ''}
      </div>
      <div class="yearly-bar"><div class="yearly-bar__fill" style="width:${pct}%"></div></div>
    </div>`;
  }
  html += '</div>';
  return html;
}

/* ─── Render: Expense List HTML ──────────────────── */

function renderExpenseListHTML(expenses) {
  if (expenses.length === 0) return '';

  let html = '<div class="expense-list">';
  expenses.forEach(exp => {
    const cat = getCategory(exp.category);
    html += `<div class="expense-item expense-item--entering" data-id="${exp.id}">
      <div class="expense-item__info">
        <span class="expense-item__dot" style="background:${cat.color}"></span>
        <div class="expense-item__details">
          <span class="expense-item__name">${escapeHtml(exp.name)}</span>
          <div class="expense-item__meta">
            <span class="category-badge">${cat.emoji} ${cat.label}</span>
            <span class="expense-item__date">${fmtDate(exp.date)}</span>
          </div>
        </div>
      </div>
      <div class="expense-item__right">
        <span class="expense-item__amount">${fmtCurr(exp.amount)}</span>
        <button class="expense-item__delete" data-id="${exp.id}" aria-label="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

/* ─── Render: Dashboard ──────────────────────────── */

function renderDashboard() {
  const total = getCurrentMonthTotal();

  // Total Spent
  animateValue(dom.dashTotal, total);
  dom.dashTotalSub.textContent = total > 0 ? `${state.expenses.length} expense${state.expenses.length !== 1 ? 's' : ''} this month` : 'This month';

  // Budget
  if (state.budget) {
    const remaining = state.budget.amount - total;
    dom.dashBudgetSub.textContent = remaining >= 0 ? `${fmtCurr(remaining)} left to spend` : `Overspent by ${fmtCurr(Math.abs(remaining))}`;
    dom.dashBudgetSub.style.color = remaining >= 0 ? 'var(--text-muted)' : 'var(--danger)';

    const pct = Math.min((total / state.budget.amount) * 100, 100);
    const r = 20;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    dom.budgetRingFill.style.strokeDasharray = circ;
    dom.budgetRingFill.style.strokeDashoffset = offset;

    let ringColor = 'var(--success)';
    if (pct >= 100) ringColor = 'var(--danger)';
    else if (pct >= 70) ringColor = 'var(--warning)';
    dom.budgetRingFill.style.stroke = ringColor;

    dom.dashBudgetRemain.textContent = fmtCurr(Math.max(0, remaining));
    dom.dashEditBudget.textContent = 'Edit';
  } else {
    dom.dashBudgetRemain.textContent = '—';
    dom.dashBudgetSub.textContent = 'Set a budget to track';
    dom.dashBudgetSub.style.color = '';
    dom.budgetRingFill.style.strokeDashoffset = 125.66;
    dom.budgetRingFill.style.stroke = 'var(--success)';
    dom.dashEditBudget.textContent = 'Set';
  }

  // Status
  if (!state.budget) {
    dom.dashStatus.textContent = 'No budget';
    dom.dashStatus.className = 'card__value card__value--sm status--muted';
    dom.dashStatusSub.textContent = 'Set a monthly budget';
  } else if (total > state.budget.amount) {
    dom.dashStatus.innerHTML = `<span class="pulse-dot pulse-dot--danger"></span> Deficit`;
    dom.dashStatus.className = 'card__value card__value--sm status--danger';
    dom.dashStatusSub.textContent = `Overspent by ${fmtCurr(total - state.budget.amount)}`;
  } else if (total === state.budget.amount) {
    dom.dashStatus.textContent = 'At limit';
    dom.dashStatus.className = 'card__value card__value--sm status--warn';
    dom.dashStatusSub.textContent = 'You used your entire budget';
  } else {
    const surplus = state.budget.amount - total;
    dom.dashStatus.innerHTML = `<span class="pulse-dot pulse-dot--success"></span> Surplus`;
    dom.dashStatus.className = 'card__value card__value--sm status--safe';
    dom.dashStatusSub.textContent = `${fmtCurr(surplus)} available`;
  }

  // Goal
  if (state.goals.length > 0) {
    const g = state.goals[0];
    dom.dashGoalName.textContent = g.name;
    const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
    dom.dashGoalFill.style.width = `${pct}%`;
    dom.dashGoalSub.textContent = `${fmtCurr(g.savedAmount)} of ${fmtCurr(g.targetAmount)} (${Math.round(pct)}%)`;
    dom.dashGoalAction.textContent = state.budget ? 'Add' : 'Edit';
  } else {
    dom.dashGoalName.textContent = 'No goal';
    dom.dashGoalFill.style.width = '0%';
    dom.dashGoalSub.textContent = 'Set a savings goal';
    dom.dashGoalAction.textContent = 'Create';
  }
}

/* ─── Render All ─────────────────────────────────── */

/* ─── Profile ──────────────────────────────────────── */

function updateProfile() {
  const initial = state.userName.charAt(0).toUpperCase();
  dom.userAvatar.textContent = initial;
  dom.userNameDisplay.textContent = state.userName;
  dom.welcomeText.textContent = `Welcome back, ${state.userName}. Track every penny, it counts!`;
  document.title = `Mintro — ${state.userName}'s Tracker`;
}

function renderAll() {
  updateViewLabel();

  let content = '';
  let showEmpty = false;

  const filtered = getFilteredExpenses();

  switch (state.currentView) {
    case 'monthly':
      content = renderMonthly();
      // Show expense list for selected day
      const selStr = toDateStr(state.selectedDate);
      const dayExp = getDayExpenses(selStr);
      if (dayExp.length > 0) {
        content += renderExpenseListHTML(dayExp);
      } else if (filtered.length === 0 && state.expenses.length === 0) {
        showEmpty = true;
      }
      break;

    case 'daily': {
      const ds = toDateStr(state.selectedDate);
      const dayExp = getDayExpenses(ds);
      content = renderDaily();
      if (dayExp.length === 0 && state.expenses.length === 0) showEmpty = true;
      break;
    }

    case 'yearly':
      content = renderYearly();
      if (state.expenses.length === 0) showEmpty = true;
      break;
  }

  dom.viewContainer.innerHTML = content;
  dom.emptyState.classList.toggle('hidden', !showEmpty);

  // Remove entering class after animation
  requestAnimationFrame(() => {
    $$('.expense-item--entering').forEach(el => {
      el.classList.remove('expense-item--entering');
    });
  });

  renderDashboard();
  renderFilters();
  updateDateFieldVisibility();
}

/* ─── Filters ────────────────────────────────────── */

function renderFilters() {
  dom.filterTabs.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = `filter-tab${state.currentFilter === 'all' ? ' filter-tab--active' : ''}`;
  allBtn.dataset.filter = 'all';
  allBtn.textContent = 'All';
  dom.filterTabs.appendChild(allBtn);

  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `filter-tab${state.currentFilter === cat.id ? ' filter-tab--active' : ''}`;
    btn.dataset.filter = cat.id;
    btn.textContent = `${cat.emoji} ${cat.label}`;
    dom.filterTabs.appendChild(btn);
  });
}

function updateDateFieldVisibility() {
  const isToday = toDateStr(state.selectedDate) === toDateStr(new Date());
  dom.dateFieldGroup.classList.toggle('hidden', state.currentView !== 'daily' && isToday);
}

/* ─── CSV Export ─────────────────────────────────── */

function exportCSV() {
  const headers = ['Date', 'Name', 'Category', 'Amount'];
  const rows = state.expenses.map(e => {
    const cat = getCategory(e.category);
    return [e.date, `"${e.name.replace(/"/g, '""')}"`, cat.label, e.amount.toFixed(2)];
  });
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coinwise_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Animations ─────────────────────────────────── */

function animateValue(el, target) {
  const duration = 300;
  const start = performance.now();
  const current = parseFloat(el.dataset.currentValue) || 0;

  if (Math.abs(current - target) < 0.01) {
    el.textContent = fmtCurr(target);
    el.dataset.currentValue = target;
    return;
  }

  function step(ts) {
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = current + (target - current) * eased;
    el.textContent = fmtCurr(val);
    el.dataset.currentValue = val;
    if (p < 1) requestAnimationFrame(step);
    else { el.textContent = fmtCurr(target); el.dataset.currentValue = target; }
  }
  requestAnimationFrame(step);
}

function createRipple(e, btn) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* ─── Form ───────────────────────────────────────── */

function handleFormSubmit(e) {
  e.preventDefault();
  const name = dom.expenseName.value.trim();
  const amount = parseFloat(dom.expenseAmount.value);
  const category = dom.expenseCategory.value;
  const dateVal = dom.expenseDate.value;

  if (!name) {
    dom.formError.textContent = 'Please enter an expense name.';
    shakeForm();
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    dom.formError.textContent = 'Please enter a valid amount greater than ₦0.';
    shakeForm();
    return;
  }

  dom.formError.textContent = '';
  addExpense(name, amount, category, dateVal || undefined);
  dom.expenseName.value = '';
  dom.expenseAmount.value = '';
  dom.expenseName.focus();
  closePanels();
}

function shakeForm() {
  dom.expenseForm.classList.remove('expense-form--shake');
  void dom.expenseForm.offsetWidth;
  dom.expenseForm.classList.add('expense-form--shake');
}

/* ─── Init ────────────────────────────────────────── */

function populateCategories() {
  dom.expenseCategory.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.emoji} ${cat.label}`;
    dom.expenseCategory.appendChild(opt);
  });
  dom.expenseCategory.value = DEFAULT_CATEGORY;
}

function setupEventListeners() {
  // Theme
  dom.themeToggle.addEventListener('click', toggleTheme);

  // FAB
  dom.fab.addEventListener('click', toggleExpensePanel);

  // Panel backdrops & close
  $$('.side-panel__backdrop, .side-panel__close').forEach(el => {
    el.addEventListener('click', closePanels);
  });

  // Expense form
  dom.expenseForm.addEventListener('submit', handleFormSubmit);
  dom.expenseName.addEventListener('input', () => { dom.formError.textContent = ''; });
  dom.expenseAmount.addEventListener('input', () => { dom.formError.textContent = ''; });

  // View switcher
  dom.viewPills.forEach(pill => {
    pill.addEventListener('click', () => setView(pill.dataset.view));
  });

  // Navigation
  dom.navPrev.addEventListener('click', navPrev);
  dom.navNext.addEventListener('click', navNext);

  // Search
  dom.searchInput.addEventListener('input', () => {
    state.searchQuery = dom.searchInput.value;
    renderAll();
  });

  // Filter tabs
  dom.filterTabs.addEventListener('click', e => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    const filter = tab.dataset.filter;
    if (filter === state.currentFilter) return;
    state.currentFilter = filter;
    renderAll();
  });

  // View container (event delegation for calendar days, delete buttons, yearly months)
  dom.viewContainer.addEventListener('click', e => {
    // Calendar day click
    const dayEl = e.target.closest('.calendar-day');
    if (dayEl && dayEl.dataset.date) {
      state.selectedDate = new Date(dayEl.dataset.date + 'T12:00:00');
      renderAll();
      return;
    }

    // Delete button
    const delBtn = e.target.closest('.expense-item__delete');
    if (delBtn) {
      deleteExpense(delBtn.dataset.id);
      return;
    }

    // Yearly month click
    const monthEl = e.target.closest('.yearly-month');
    if (monthEl) {
      const y = parseInt(monthEl.dataset.year);
      const m = parseInt(monthEl.dataset.month);
      state.selectedDate = new Date(y, m, 1);
      state.currentView = 'monthly';
      $$('.pill').forEach(p => p.classList.toggle('pill--active', p.dataset.view === 'monthly'));
      renderAll();
      return;
    }
  });

  // Budget panel
  dom.dashEditBudget.addEventListener('click', () => {
    if (state.budget) dom.budgetInput.value = state.budget.amount;
    openPanel('budget');
  });
  dom.saveBudgetBtn.addEventListener('click', () => {
    const amt = parseFloat(dom.budgetInput.value);
    if (!amt || amt <= 0) return;
    saveBudget(amt);
    dom.budgetInput.value = '';
  });
  dom.budgetInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') dom.saveBudgetBtn.click();
  });

  // Goal panel
  dom.dashGoalAction.addEventListener('click', () => {
    if (state.goals.length > 0) {
      const g = state.goals[0];
      dom.goalName.value = g.name;
      dom.goalTarget.value = g.targetAmount;
      dom.goalDate.value = g.targetDate || '';
      dom.goalPanelTitle.textContent = 'Edit Savings Goal';
      dom.deleteGoalBtn.classList.remove('hidden');
      dom.saveGoalBtn.textContent = 'Save Changes';
    } else {
      dom.goalName.value = '';
      dom.goalTarget.value = '';
      dom.goalDate.value = '';
      dom.goalPanelTitle.textContent = 'Create Savings Goal';
      dom.deleteGoalBtn.classList.add('hidden');
      dom.saveGoalBtn.textContent = 'Save Goal';
    }
    openPanel('goal');
  });
  dom.saveGoalBtn.addEventListener('click', () => {
    const name = dom.goalName.value;
    const target = parseFloat(dom.goalTarget.value);
    const dateVal = dom.goalDate.value;
    saveGoal(name, target, dateVal || null);
  });
  dom.deleteGoalBtn.addEventListener('click', deleteGoal);

  // Export
  dom.exportBtn.addEventListener('click', exportCSV);

  // Ripple on buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn, .header-btn, .fab, .nav-btn, .pill, .card__action');
    if (btn) createRipple(e, btn);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanels();
  });
}

function init() {
  cacheDom();
  loadState();
  applyTheme(state.theme);
  populateCategories();

  // Set default date for today
  dom.expenseDate.value = toDateStr(new Date());

  updateProfile();
  renderAll();

  // Set active pill
  dom.viewPills.forEach(p => {
    p.classList.toggle('pill--active', p.dataset.view === state.currentView);
  });

  setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
