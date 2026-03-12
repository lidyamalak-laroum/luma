/**
 * Client-side view router
 * Manages showing/hiding views and updating the navbar active state.
 */

import { renderHistory } from "./views/history.js";

const AUTH_VIEWS = new Set(["login", "register", "verify"]);

export function navigate(view) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));

    const target = document.getElementById(`view-${view}`);
    if (target) target.classList.add("active");

    const nav = document.getElementById("main-nav");
    if (!nav) return;

    if (AUTH_VIEWS.has(view)) {
        nav.classList.add("hidden");
    } else {
        nav.classList.remove("hidden");
        document.querySelectorAll(".nav-item").forEach((item) => {
            item.classList.toggle("active", item.dataset.target === view);
        });
    }
}

export function initRouter() {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("click", () => {
            navigate(item.dataset.target);
            // Refresh history from Firestore whenever the tab is opened
            if (item.dataset.target === "history") {
                renderHistory();
            }
        });
    });
}
