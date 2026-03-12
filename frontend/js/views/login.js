import { login } from "../services/auth.service.js";
import { navigate } from "../router.js";

export function initLoginView() {
    // ── Login form ────────────────────────────────────────────
    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        try {
            await login(email, password);
            // onAuthStateChanged in main.js handles redirect
        } catch (err) {
            alert(err.message);
        }
    });

    // ── Navigation ────────────────────────────────────────────
    document.getElementById("btn-go-to-register")
        ?.addEventListener("click", () => navigate("register"));

    // ── Password toggle ───────────────────────────────────────
    document.querySelectorAll(".toggle-password").forEach((icon) => {
        icon.addEventListener("click", () => {
            const input = document.getElementById(icon.dataset.target);
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            icon.classList.toggle("fa-eye", !isHidden);
            icon.classList.toggle("fa-eye-slash", isHidden);
        });
    });
}
