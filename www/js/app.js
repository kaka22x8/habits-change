/* ================================================================
   改变自己 - Habit Tracker & Expense Manager
   ================================================================ */

// ── DOM refs ───────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const mainContent = $('#mainContent');
const toast = $('#toast');
const fab = $('#fabAddExpense');
const expenseModal = $('#expenseModal');

// ── Data ────────────────────────────────────────────────────
const HABITS = [
  { id: 'fitness',  name: '健身', icon: '🏋️', color: '#FF6B6B', bg: '#FFF0F0' },
  { id: 'running',  name: '跑步', icon: '🏃', color: '#4ECDC4', bg: '#F0FAF9' },
  { id: 'skincare', name: '护肤', icon: '💆', color: '#FFB347', bg: '#FFF7ED' },
  { id: 'earning',  name: '挣钱', icon: '💰', color: '#45B7D1', bg: '#F0F7FA' },
  { id: 'photo',    name: '摄影', icon: '📷', color: '#96CEB4', bg: '#F0FAF4' },
  { id: 'research', name: '科研', icon: '🔬', color: '#A78BFA', bg: '#F5F0FF' },
];

const EXPENSE_CATEGORIES = [
  { id: 'food',     name: '餐饮', icon: '🍜', bg: '#FFF0F0' },
  { id: 'transport',name: '交通', icon: '🚗', bg: '#F0F4FF' },
  { id: 'shopping', name: '购物', icon: '🛍️', bg: '#FFF7ED' },
  { id: 'entertain',name: '娱乐', icon: '🎮', bg: '#F5F0FF' },
  { id: 'skincare', name: '护肤', icon: '💆', bg: '#FFF5FA' },
  { id: 'fitness',  name: '健身', icon: '🏋️', bg: '#F0FAF9' },
  { id: 'learn',    name: '学习', icon: '📚', bg: '#F0FAF4' },
  { id: 'other',    name: '其他', icon: '📌', bg: '#F2F3F7' },
];

let selectedExpCategory = 'food';
let calendarYear, calendarMonth;

// ── Date helpers ────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d) { return d.toISOString().slice(0, 10); }
function fmtMonthYear(y, m) { return `${y}年${String(m + 1).padStart(2, '0')}月`; }
function fmtCN(d) { return `${d.getMonth() + 1}月${d.getDate()}日`; }

// ── Storage ─────────────────────────────────────────────────
const STORAGE_KEY_CHECKINS = 'habits_checkins';
const STORAGE_KEY_EXPENSES = 'habits_expenses';

function loadCheckins() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CHECKINS)) || {}; }
  catch { return {}; }
}

function saveCheckins(data) {
  localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(data));
}

function loadExpenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_EXPENSES)) || []; }
  catch { return []; }
}

function saveExpenses(data) {
  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(data));
}

function getCheckins(date) {
  const data = loadCheckins();
  return data[date] || [];
}

function toggleCheckin(date, habitId) {
  const data = loadCheckins();
  if (!data[date]) data[date] = [];
  const idx = data[date].indexOf(habitId);
  if (idx >= 0) {
    data[date].splice(idx, 1);
    if (data[date].length === 0) delete data[date];
  } else {
    data[date].push(habitId);
  }
  saveCheckins(data);
}

function isCheckedIn(date, habitId) {
  return getCheckins(date).includes(habitId);
}

// ── Streak calculation ──────────────────────────────────────
function getStreak(habitId) {
  const data = loadCheckins();
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  while (true) {
    const ds = fmtDate(d);
    if (!data[ds] || !data[ds].includes(habitId)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ── Toast ───────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── Motivational messages ───────────────────────────────────
const MOTIVATIONS = [
  '每天进步一点点 ✨', '坚持就是胜利 💪', '今天的努力是明天的底气',
  '自律即自由 🕊️', '每一步都算数', '不积跬步无以至千里',
  '你比想象中更强大', '把优秀变成习惯', '积少成多，聚沙成塔',
  '每一天都是新的开始', '做最好的自己 🌟',
];

function randomMotivation() {
  return MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
}

// ══════════════════════════════════════════════════════════════
//  SCREEN: Check-in
// ══════════════════════════════════════════════════════════════

function renderCheckin() {
  const grid = $('#habitsGrid');
  const date = today();
  const checkins = getCheckins(date);
  const count = checkins.length;

  grid.innerHTML = HABITS.map(h => {
    const done = checkins.includes(h.id);
    const streak = getStreak(h.id);
    return `
      <div class="habit-card${done ? ' completed' : ''}" data-habit="${h.id}"
           style="${done ? `border-color:${h.color}; background:${h.bg}` : ''}">
        <div class="check-badge" style="background:${h.color}"></div>
        <div class="habit-icon">${h.icon}</div>
        <div class="habit-name">${h.name}</div>
        <div class="habit-streak" style="color:${h.color}; background:${h.bg}">
          🔥 ${streak} 天
        </div>
      </div>`;
  }).join('');

  // Summary
  $('#summaryCount').textContent = `${count}/${HABITS.length}`;
  $('#summaryMotivation').textContent = count === HABITS.length
    ? '太棒了！全部完成 🎉' : count >= 3 ? '加油，快过半了！' : randomMotivation();

  // Bind clicks
  grid.querySelectorAll('.habit-card').forEach(card => {
    card.addEventListener('click', () => {
      const habitId = card.dataset.habit;
      toggleCheckin(date, habitId);
      // Haptic-like animation
      card.style.transform = 'scale(0.92)';
      setTimeout(() => { card.style.transform = ''; }, 150);

      const nowDone = isCheckedIn(date, habitId);
      if (nowDone) {
        const h = HABITS.find(x => x.id === habitId);
        showToast(`✅ ${h.name} 打卡成功！`);
      }
      renderCheckin();
      renderCalendar(); // refresh calendar dots
    });
  });
}

function updateHeader() {
  const d = new Date();
  $('#headerDay').textContent = d.getDate();
  $('#headerMonthYear').textContent = `${d.getMonth() + 1}月 ${d.getFullYear()}`;
  $('#headerMotivation').textContent = randomMotivation();
}

// ══════════════════════════════════════════════════════════════
//  SCREEN: Calendar
// ══════════════════════════════════════════════════════════════

function renderCalendar(year, month) {
  calendarYear = year;
  calendarMonth = month;
  $('#calMonthLabel').textContent = fmtMonthYear(year, month);

  const grid = $('#calGrid');
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const todayStr = today();
  const data = loadCheckins();

  let html = '';

  // Previous month fill
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    html += dayCell(year, month - 1, d, true, todayStr, data);
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    html += dayCell(year, month, d, false, todayStr, data);
  }

  // Next month fill
  const remaining = 42 - (firstDay + daysInMonth);
  for (let d = 1; d <= remaining; d++) {
    html += dayCell(year, month + 1, d, true, todayStr, data);
  }

  grid.innerHTML = html;

  // Bind clicks on current-month days
  grid.querySelectorAll('.calendar-day:not(.other-month)').forEach(el => {
    el.addEventListener('click', () => {
      const ds = el.dataset.date;
      showDayDetail(ds);
      grid.querySelectorAll('.calendar-day').forEach(e => e.style.outline = 'none');
      el.style.outline = `2px solid var(--primary)`;
      el.style.outlineOffset = '-2px';
    });
  });

  renderLegend();
}

function dayCell(year, month, day, isOther, todayStr, data) {
  const d = new Date(year, month, day);
  const ds = fmtDate(d);
  const isToday = ds === todayStr;
  const checkins = data[ds] || [];
  const dots = checkins.map(hid => {
    const h = HABITS.find(x => x.id === hid);
    return h ? `<span class="dot" style="background:${h.color}"></span>` : '';
  }).join('');

  return `
    <div class="calendar-day${isOther ? ' other-month' : ''}${isToday ? ' today' : ''}"
         data-date="${ds}">
      <span>${day}</span>
      <div class="dots">${dots}</div>
    </div>`;
}

function showDayDetail(ds) {
  const container = $('#dayDetail');
  const checkins = getCheckins(ds);
  const d = new Date(ds + 'T00:00:00');
  const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

  if (checkins.length === 0) {
    container.innerHTML = `
      <div class="detail-date">${label}</div>
      <div style="color:var(--text-muted);font-size:13px;">这天没有打卡记录</div>`;
  } else {
    const items = checkins.map(hid => {
      const h = HABITS.find(x => x.id === hid);
      return h ? `
        <div class="detail-item">
          <span class="status-icon">${h.icon}</span>
          <span>${h.name}</span>
          <span style="margin-left:auto;color:${h.color};font-size:12px;">✓ 已完成</span>
        </div>` : '';
    }).join('');
    container.innerHTML = `<div class="detail-date">${label}</div>${items}`;
  }
  container.classList.add('show');
}

function renderLegend() {
  const el = $('#calLegend');
  el.innerHTML = HABITS.map(h => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${h.color}"></span>
      ${h.name}
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════════
//  SCREEN: Expenses
// ══════════════════════════════════════════════════════════════

function renderExpenses() {
  const expenses = loadExpenses();
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Monthly total
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth));
  const total = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  $('#expenseTotal').textContent = total.toFixed(2);

  // List (recent first, max 50)
  const list = $('#expenseList');
  const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 50);

  if (recent.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">还没有记账记录<br>点击下方按钮开始记录</div>
      </div>`;
    return;
  }

  list.innerHTML = recent.map(e => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category) || EXPENSE_CATEGORIES[7];
    const d = new Date(e.date + 'T00:00:00');
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
    return `
      <div class="expense-item" data-id="${e.id}">
        <div class="expense-icon" style="background:${cat.bg}">${cat.icon}</div>
        <div class="expense-info">
          <div class="expense-category">${cat.name}</div>
          <div class="expense-note">${e.note || cat.name}</div>
          <div class="expense-date">${dateLabel}</div>
        </div>
        <div class="expense-amount">-¥${parseFloat(e.amount).toFixed(2)}</div>
        <button class="delete-btn" data-del="${e.id}">✕</button>
      </div>`;
  }).join('');

  // Delete bindings
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = parseInt(btn.dataset.del);
      const expenses = loadExpenses();
      saveExpenses(expenses.filter(e => e.id !== id));
      showToast('已删除');
      renderExpenses();
    });
  });
}

function renderExpenseCategoryPicker() {
  const picker = $('#expCategoryPicker');
  picker.innerHTML = EXPENSE_CATEGORIES.map(c => `
    <div class="cat-option${c.id === selectedExpCategory ? ' selected' : ''}" data-cat="${c.id}">
      <span class="cat-emoji">${c.icon}</span>
      ${c.name}
    </div>`).join('');

  picker.querySelectorAll('.cat-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedExpCategory = opt.dataset.cat;
      picker.querySelectorAll('.cat-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

function openExpenseModal() {
  selectedExpCategory = 'food';
  renderExpenseCategoryPicker();
  $('#expAmount').value = '';
  $('#expNote').value = '';
  $('#expDate').value = today();
  expenseModal.classList.add('show');
  setTimeout(() => $('#expAmount').focus(), 300);
}

function closeExpenseModal() {
  expenseModal.classList.remove('show');
}

function saveExpenseHandler() {
  const amount = parseFloat($('#expAmount').value);
  if (!amount || amount <= 0) {
    showToast('请输入有效金额');
    return;
  }
  const expense = {
    id: Date.now(),
    amount: amount,
    category: selectedExpCategory,
    note: $('#expNote').value.trim() || (EXPENSE_CATEGORIES.find(c => c.id === selectedExpCategory) || {}).name || '',
    date: $('#expDate').value || today(),
  };
  const expenses = loadExpenses();
  expenses.push(expense);
  saveExpenses(expenses);
  closeExpenseModal();
  renderExpenses();
  renderStats();
  showToast('记账成功 💰');
}

// ══════════════════════════════════════════════════════════════
//  SCREEN: Stats
// ══════════════════════════════════════════════════════════════

function renderStats() {
  const container = $('#habitStats');
  const data = loadCheckins();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const monthPrefix = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`;

  // Per-habit stats
  const habitStats = HABITS.map(h => {
    const streak = getStreak(h.id);
    let monthCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const checks = data[ds] || [];
      if (checks.includes(h.id)) monthCount++;
    }
    const rate = Math.round((monthCount / new Date().getDate()) * 100);
    return { ...h, streak, monthCount, rate };
  });

  container.innerHTML = habitStats.map(h => `
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-title">
          <span style="background:${h.bg};width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">${h.icon}</span>
          ${h.name}
        </div>
        <div class="stat-value">🔥 ${h.streak}天</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;color:var(--text-secondary);">
        <span>本月 ${h.monthCount}/${new Date().getDate()} 天</span>
        <span>${h.rate}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${Math.min(h.rate, 100)}%;background:${h.color};"></div>
      </div>
    </div>
  `).join('');

  // Add expense summary
  const expenses = loadExpenses();
  const monthExpenses = expenses.filter(e => e.date.startsWith(monthPrefix));
  const catSummary = {};
  monthExpenses.forEach(e => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category);
    const name = cat ? cat.name : '其他';
    catSummary[name] = (catSummary[name] || 0) + parseFloat(e.amount || 0);
  });

  if (Object.keys(catSummary).length > 0) {
    const maxAmount = Math.max(...Object.values(catSummary));
    const expenseHtml = Object.entries(catSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => {
        const pct = Math.round((amount / maxAmount) * 100);
        const cat = EXPENSE_CATEGORIES.find(c => c.name === name);
        const icon = cat ? cat.icon : '📌';
        return `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px;">
            <span>${icon}</span>
            <span style="flex:1;font-weight:500;">${name}</span>
            <span style="font-weight:700;">¥${amount.toFixed(2)}</span>
            <div class="progress-bar" style="width:80px;">
              <div class="progress-fill" style="width:${pct}%;background:var(--primary);"></div>
            </div>
          </div>`;
      }).join('');

    container.insertAdjacentHTML('beforeend', `
      <div class="section-title">本月支出分布</div>
      <div class="stat-card">${expenseHtml}</div>
    `);
  }
}

// ══════════════════════════════════════════════════════════════
//  Navigation
// ══════════════════════════════════════════════════════════════

function switchScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $$('.tab-item').forEach(t => t.classList.remove('active'));

  const screenMap = {
    checkin: 'screen-checkin',
    calendar: 'screen-calendar',
    expenses: 'screen-expenses',
    stats: 'screen-stats',
  };

  const screenEl = $(`#${screenMap[name]}`);
  if (screenEl) screenEl.classList.add('active');

  const tabEl = document.querySelector(`.tab-item[data-screen="${name}"]`);
  if (tabEl) tabEl.classList.add('active');

  // Show/hide FAB
  fab.style.display = name === 'expenses' ? 'flex' : 'none';

  // Refresh content
  if (name === 'checkin') renderCheckin();
  if (name === 'calendar') {
    const now = new Date();
    renderCalendar(now.getFullYear(), now.getMonth());
  }
  if (name === 'expenses') renderExpenses();
  if (name === 'stats') renderStats();

  mainContent.scrollTop = 0;
}

// ══════════════════════════════════════════════════════════════
//  Event Bindings
// ══════════════════════════════════════════════════════════════

$$('.tab-item').forEach(tab => {
  tab.addEventListener('click', () => switchScreen(tab.dataset.screen));
});

fab.addEventListener('click', openExpenseModal);
$('#btnSaveExpense').addEventListener('click', saveExpenseHandler);
$('#btnCloseModal').addEventListener('click', closeExpenseModal);

expenseModal.addEventListener('click', (e) => {
  if (e.target === expenseModal) closeExpenseModal();
});

$('#calPrev').addEventListener('click', () => {
  calendarMonth--;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
  renderCalendar(calendarYear, calendarMonth);
});

$('#calNext').addEventListener('click', () => {
  calendarMonth++;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
  renderCalendar(calendarYear, calendarMonth);
});

// Keyboard shortcut to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && expenseModal.classList.contains('show')) {
    closeExpenseModal();
  }
});

// ══════════════════════════════════════════════════════════════
//  Init
// ══════════════════════════════════════════════════════════════

function init() {
  updateHeader();
  renderCheckin();
  renderExpenseCategoryPicker();

  // Update header every minute (for date change at midnight)
  setInterval(updateHeader, 60000);

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
