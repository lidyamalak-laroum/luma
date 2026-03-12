import { logout } from "../services/auth.service.js";
import { getTheme, setTheme } from "../services/storage.service.js";

export function initSettingsView() {
    // ── Dark mode toggle ──────────────────────────────────────
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
        // Apply saved preference on load
        if (getTheme() === "dark") {
            document.body.classList.add("dark-mode");
            themeBtn.classList.replace("fa-moon", "fa-sun");
        }

        themeBtn.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark-mode");
            setTheme(isDark ? "dark" : "light");
            themeBtn.classList.toggle("fa-moon", !isDark);
            themeBtn.classList.toggle("fa-sun", isDark);
        });
    }

    // ── Logout ────────────────────────────────────────────────
    document.getElementById("btn-logout")
        ?.addEventListener("click", () => logout());
}

/** Populate the settings profile section */
export function updateSettingsProfile(username, email) {
    const usernameEl = document.getElementById("settings-username");
    const emailEl = document.getElementById("settings-email");
    if (usernameEl) usernameEl.textContent = username;
    if (emailEl) emailEl.textContent = email;
}
