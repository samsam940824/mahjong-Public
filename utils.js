// utils.js — 共用工具函式

/**
 * 防 XSS：將字串轉成安全的 HTML 文字
 */
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ── Toast 通知系統 ────────────────────────────────────────────────
// 全站統一的通知，右下角浮現、可堆疊、3.5 秒自動消失
function _ensureToastContainer() {
    let c = document.getElementById('toastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        c.setAttribute('role', 'status');
        c.setAttribute('aria-live', 'polite');
        document.body.appendChild(c);
    }
    return c;
}

/**
 * 顯示 toast 通知。
 * @param {string} msg
 * @param {'success'|'error'|'info'|'warn'} [type='info']
 * @param {number} [duration=3500]
 */
function toast(msg, type = 'info', duration = 3500) {
    const c = _ensureToastContainer();
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    const icon = { success: '✓', error: '✕', warn: '⚠', info: 'ⓘ' }[type] || 'ⓘ';
    t.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg"></span>`;
    t.querySelector('.toast-msg').textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-in'));
    setTimeout(() => {
        t.classList.remove('toast-in');
        t.classList.add('toast-out');
        t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, duration);
}

/**
 * 舊版 showMessage：保留相容，內部轉呼叫 toast。
 */
let _alertTimer = null;
function showMessage(msg, isSuccess = false, alertId = 'msgAlert') {
    toast(msg, isSuccess ? 'success' : 'error');
}

function showError(msg, alertId) {
    toast(msg, 'error');
}

/**
 * 通用 tab 切換：點擊 .tab-btn[data-tab=ID] 會顯示 #ID 的 .tab-content
 * @param {HTMLElement} [root=document]
 * @param {function} [onChange] - (tabId) => void
 */
function setupTabs(root, onChange) {
    const scope = root || document;
    const btns = scope.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        btn.setAttribute('role', 'tab');
        btn.setAttribute('tabindex', '0');
        const handler = () => {
            const tabId = btn.dataset.tab;
            scope.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            scope.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const target = document.getElementById(tabId);
            if (target) target.classList.add('active');
            if (onChange) onChange(tabId);
        };
        btn.addEventListener('click', handler);
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });
    });
}

/**
 * 排行榜聚合：接受 ledgers，回傳依分數降序排列的玩家分數陣列。
 * @param {Array} ledgers - {delta, players:{id,name,type}, sessions:{date}}
 * @param {object} opts
 * @param {'month'|'year'|'all'} [opts.range='all']
 * @param {boolean} [opts.includeGuests=true]
 * @param {string} [opts.referenceDate] - YYYY-MM-DD, 預設今天
 * @returns {Array<{id,name,type,total_score,sessions_count}>}
 */
function aggregateLeaderboard(ledgers, opts = {}) {
    const range = opts.range || 'all';
    const includeGuests = opts.includeGuests !== false;
    const ref = opts.referenceDate || new Date().toISOString();
    const currentMonth = ref.slice(0, 7);
    const currentYear  = ref.slice(0, 4);

    const scores = {};
    ledgers.forEach(l => {
        const p = l.players;
        if (!p) return;
        if (!includeGuests && p.type === 'guest') return;
        const dateStr = l.sessions && l.sessions.date;
        if (!dateStr) return;
        if (range === 'month' && !dateStr.startsWith(currentMonth)) return;
        if (range === 'year'  && !dateStr.startsWith(currentYear))  return;
        if (!scores[p.id]) scores[p.id] = { id: p.id, name: p.name, type: p.type, total_score: 0, sessions_count: 0 };
        scores[p.id].total_score += l.delta;
        scores[p.id].sessions_count += 1;
    });
    return Object.values(scores).sort((a, b) => b.total_score - a.total_score);
}

/**
 * 渲染排行榜表格列（含獎牌、客籤、正負色）。
 * @param {HTMLElement} tbody
 * @param {Array} rows - aggregateLeaderboard 的輸出
 * @param {object} [opts]
 * @param {boolean} [opts.medals=true]
 * @param {number} [opts.limit]
 */
function renderLeaderboardRows(tbody, rows, opts = {}) {
    const limit = opts.limit || rows.length;
    const medals = opts.medals !== false;
    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted" style="padding:24px;">目前無資料</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    rows.slice(0, limit).forEach((stat, i) => {
        const tr = document.createElement('tr');
        if (medals && i < 3) tr.classList.add('rank-' + (i + 1));

        const tdPlayer = document.createElement('td');
        const medal = medals ? ['🥇', '🥈', '🥉'][i] || '' : '';
        const rankBadge = medals && i < 3
            ? `<span class="rank-chip rank-chip-${i + 1}">${i + 1}</span>`
            : `<span class="rank-chip rank-chip-other">${i + 1}</span>`;
        tdPlayer.innerHTML = `${rankBadge}${medal ? `<span class="medal">${medal}</span>` : ''}<span class="player-name-cell">${escapeHTML(stat.name)}</span>${stat.type === 'guest' ? '<span class="guest-tag">客</span>' : ''}`;

        const tdScore = document.createElement('td');
        const sign = stat.total_score > 0 ? 'score-positive' : stat.total_score < 0 ? 'score-negative' : 'score-neutral';
        tdScore.className = 'text-right ' + sign;
        tdScore.style.fontVariantNumeric = 'tabular-nums';
        tdScore.textContent = (stat.total_score > 0 ? '+' : '') + stat.total_score;

        tr.append(tdPlayer, tdScore);
        tbody.appendChild(tr);
    });
}

/**
 * 數字 count-up 動畫。
 */
function animateNumber(el, to, duration = 350) {
    const from = parseInt(el.dataset.curValue || '0', 10);
    if (from === to) { el.textContent = (to > 0 ? '+' : '') + to; el.dataset.curValue = to; return; }
    const start = performance.now();
    function frame(t) {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(from + (to - from) * eased);
        el.textContent = (v > 0 ? '+' : '') + v;
        if (p < 1) requestAnimationFrame(frame);
        else el.dataset.curValue = to;
    }
    requestAnimationFrame(frame);
}

/**
 * 在導覽列中標記目前頁面為 active。
 */
function markActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
        if (a.dataset.page === current) {
            a.classList.add('nav-active');
            a.setAttribute('aria-current', 'page');
        }
    });
}

/**
 * 註冊 service worker（PWA）。
 */
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW 註冊失敗', err));
    });
}

document.addEventListener('DOMContentLoaded', markActiveNav);
registerServiceWorker();

// ── Shared Session Calendar (Flatpickr + 藍點) ───────────────────────
let _scDateSet      = new Set();
let _scFpInstance   = null;
let _scInputId      = null;
let _scOnChange     = null;
let _scFetchDatesFn = null;

function _scToYMD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function _scBuild(defaultDate) {
    if (_scFpInstance) _scFpInstance.destroy();
    _scFpInstance = flatpickr('#' + _scInputId, {
        dateFormat: 'Y-m-d',
        defaultDate: defaultDate || new Date(),
        onDayCreate(_d, _s, _fp, dayElem) {
            if (_scDateSet.has(_scToYMD(dayElem.dateObj))) {
                const dot = document.createElement('span');
                dot.className = 'session-dot';
                dayElem.appendChild(dot);
            }
        },
        onChange(_dates, dateStr) {
            if (dateStr && _scOnChange) _scOnChange(dateStr);
        }
    });
}

async function initSessionCalendar(inputId, defaultDate, onChange, fetchDatesFn) {
    _scInputId  = inputId;
    _scOnChange = onChange || null;
    _scFetchDatesFn = fetchDatesFn || (async () => {
        const { data, error } = await window.sb.from('sessions').select('date');
        if (error) throw error;
        return data.map(s => s.date);
    });
    try {
        _scDateSet = new Set(await _scFetchDatesFn());
    } catch (e) {
        console.error('initSessionCalendar: 載入日期失敗', e);
    }
    _scBuild(defaultDate);
}

async function refreshSessionCalendar() {
    const currentDate = _scFpInstance ? _scFpInstance.input.value : null;
    try {
        _scDateSet = new Set(await _scFetchDatesFn());
    } catch (e) {
        console.error('refreshSessionCalendar: 載入日期失敗', e);
    }
    _scBuild(currentDate || new Date());
}

function getCalendarDate() {
    return _scFpInstance ? _scFpInstance.input.value : '';
}

function setCalendarDate(date) {
    if (_scFpInstance) _scFpInstance.setDate(date, false);
}
