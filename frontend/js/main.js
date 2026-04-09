// ── Imports ──────────────────────────────────────────────────────────────────
import "./firebase.init.js"; // Boot Firebase first

import { onAuthChange, getUserDoc, logout } from "./services/auth.service.js";
import { initRouter, navigate } from "./router.js";
import { justRegistered, setJustRegistered } from "./appState.js";

import { initLoginView } from "./views/login.js";
import { initRegisterView } from "./views/register.js";
import { initVerifyView } from "./views/verify.js";
import { initHomeView, updateHomeGreeting, renderRecentAdvice } from "./views/home.js";
import { initHistoryView, renderHistory } from "./views/history.js";
import { initSettingsView, updateSettingsProfile } from "./views/settings.js";

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // ── Theme: force light mode by default for new visitors ───────────────────
    const savedTheme = localStorage.getItem("luma_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        // First visit or explicit "light" — always start in light mode
        document.body.classList.remove("dark-mode");
    }

    // Init router (nav-item click listeners)
    initRouter();

    // Init all view-level event listeners
    initLoginView();
    initRegisterView();
    initVerifyView();
    initHomeView();
    initHistoryView();
    initSettingsView();

    // ── Auth state listener ───────────────────────────────────────────────────
    onAuthChange(async (user) => {
        if (user) {
            const isAnonymous = user.isAnonymous;

            if (isAnonymous) {
                // Anonymous/guest user — no Firestore doc or verification needed
                navigate("home");
                await Promise.all([renderHistory(), renderRecentAdvice()]);
                updateHomeGreeting("Guest User");
                updateSettingsProfile("Guest User", "Anonymous session");
                return;
            }

            // Regular email/password user
            const snap = await getUserDoc(user.uid);

            // Guard: Firestore doc may not exist yet
            if (!snap.exists()) {
                await logout();
                navigate("login");
                return;
            }

            const data = snap.data();

            if (!data?.verified) {
                if (justRegistered) {
                    // User just signed up in this session — show verify view.
                    setJustRegistered(false);
                    navigate("verify");
                } else {
                    // Stale persisted session: registered before but never verified.
                    // Sign them out so they land on the Login page.
                    await logout();
                    navigate("login");
                }
                return;
            }

            // Derive a display name: prefer Firestore username, fall back to email prefix
            const displayName = data.username || user.email.split("@")[0];
            const email = user.email;

            navigate("home");
            await Promise.all([renderHistory(), renderRecentAdvice()]);
            updateHomeGreeting(displayName);
            updateSettingsProfile(displayName, email);
        } else {
            navigate("login");
        }
    });
});