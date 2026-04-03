// ── Imports ──────────────────────────────────────────────────────────────────
import "./firebase.init.js"; // Boot Firebase first

import { onAuthChange, getUserDoc, logout } from "./services/auth.service.js";
import { initRouter, navigate } from "./router.js";
import { justRegistered, setJustRegistered } from "./appState.js";

import { initLoginView } from "./views/login.js";
import { initRegisterView } from "./views/register.js";
import { initVerifyView } from "./views/verify.js";
import { initHomeView, updateHomeGreeting } from "./views/home.js";
import { initHistoryView, renderHistory } from "./views/history.js";
import { initSettingsView, updateSettingsProfile } from "./views/settings.js";

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
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
            const DEMO_EMAIL = "luma.demo.user@gmail.com";
            const isDemo = user.email === DEMO_EMAIL;

            const snap = await getUserDoc(user.uid);

            // Guard: Firestore doc may not exist yet
            if (!snap.exists() && !isDemo) {
                await logout();
                navigate("login");
                return;
            }

            const data = snap.exists() ? snap.data() : {};

            // Bypass verification for the demo account
            if (!isDemo && !data?.verified) {
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
            const displayName = isDemo ? "Demo User" : (data.username || user.email.split("@")[0]);
            const email = user.email;

            navigate("home");
            await renderHistory();
            updateHomeGreeting(displayName);
            updateSettingsProfile(displayName, email);
        } else {
            navigate("login");
        }
    });
});