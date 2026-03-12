const HISTORY_KEY = "luma_scan_history";
const THEME_KEY = "luma_theme";

// ── Scan history ─────────────────────────────────────────────

export function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

export function addHistoryItem(item) {
    const history = getHistory();
    history.unshift({ ...item, dateString: new Date().toLocaleString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

// ── Theme preference ─────────────────────────────────────────

export function getTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
}

export function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}
