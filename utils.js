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

/**
 * 顯示頁面頂端的提示訊息，5 秒後自動消失。
 * @param {string} msg
 * @param {boolean} [isSuccess=false]
 * @param {string} [alertId='msgAlert']
 */
let _alertTimer = null;
function showMessage(msg, isSuccess = false, alertId = 'msgAlert') {
    const el = document.getElementById(alertId);
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert ' + (isSuccess ? 'alert-success' : 'alert-danger');
    el.style.display = 'block';

    clearTimeout(_alertTimer);
    _alertTimer = setTimeout(() => { el.style.display = 'none'; }, 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * showMessage 的錯誤簡化版
 */
function showError(msg, alertId) {
    showMessage(msg, false, alertId);
}

/**
 * 在導覽列中標記目前頁面為 active。
 * 比對 <a> 的 href 與目前 pathname。
 */
function markActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
        if (a.dataset.page === current) {
            a.classList.add('nav-active');
        }
    });
}

document.addEventListener('DOMContentLoaded', markActiveNav);

// ── Shared Session Calendar (Flatpickr + 藍點) ───────────────────────
// 共用於：query.html、session_new.html、achievements.html
// 差異只有 onChange callback 和 fetchDatesFn（藍點來源）
let _scDateSet      = new Set();
let _scFpInstance   = null;
let _scInputId      = null;
let _scOnChange     = null;
let _scFetchDatesFn = null; // 預設從 sessions 表抓，可覆寫

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

/**
 * 初始化日曆（第一次呼叫）。
 * @param {string}        inputId       - input 元素 id
 * @param {string|Date}   defaultDate   - 預設選取日期
 * @param {function|null} onChange      - 選取日期後的 callback(dateStr)；不需要可傳 null
 * @param {function|null} fetchDatesFn  - async function，回傳 string[] 日期陣列；
 *                                        預設從 sessions 表抓，achievements 等頁面可覆寫
 */
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

/**
 * 重新載入日期並刷新日曆藍點（新增/刪除資料後呼叫）。
 * 保留目前選取日期，不需重新傳其他參數。
 */
async function refreshSessionCalendar() {
    const currentDate = _scFpInstance ? _scFpInstance.input.value : null;
    try {
        _scDateSet = new Set(await _scFetchDatesFn());
    } catch (e) {
        console.error('refreshSessionCalendar: 載入日期失敗', e);
    }
    _scBuild(currentDate || new Date());
}

/**
 * 取得目前日曆選取的日期字串（YYYY-MM-DD）。
 */
function getCalendarDate() {
    return _scFpInstance ? _scFpInstance.input.value : '';
}

/**
 * 以程式方式設定日曆日期（編輯模式填表時使用）。
 * @param {string|Date} date
 */
function setCalendarDate(date) {
    if (_scFpInstance) _scFpInstance.setDate(date, false);
}
