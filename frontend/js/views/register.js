import { register, createUserDoc, auth } from "../services/auth.service.js";
import { sendCode } from "../services/api.service.js";
import { navigate } from "../router.js";
import { setJustRegistered } from "../appState.js";

export function initRegisterView() {
    // ── Password validation indicators ───────────────────────
    document.getElementById("reg-password")
        ?.addEventListener("input", (e) => validatePassword(e.target.value));

    // ── Navigation ────────────────────────────────────────────
    document.getElementById("btn-go-to-login")
        ?.addEventListener("click", () => navigate("login"));

    // ── Register form ─────────────────────────────────────────
    document.getElementById("register-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("reg-email").value;
        const pass = document.getElementById("reg-password").value;
        const username = document.getElementById("reg-username").value.trim();

        if (!validatePassword(pass)) {
            alert("Please meet all password requirements.");
            return;
        }

        try {
            setJustRegistered(true);
            const cred = await register(email, pass);
            const user = cred.user;

            await createUserDoc(user.uid, { email, username });
            await sendCode(user.uid, email);

            navigate("verify");
        } catch (err) {
            setJustRegistered(false); // reset flag on failure
            if (err.code === "auth/email-already-in-use") {
                alert("Account already exists. Please log in.");
                navigate("login");
            } else if (err.message?.includes("Missing or insufficient permissions")) {
                alert("Database Permission Error: Please update your Firestore Security Rules.");
            } else {
                alert(err.message);
            }
        }
    });
}

function validatePassword(password) {
    const reqs = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };

    document.getElementById("req-length")?.classList.toggle("valid", reqs.length);
    document.getElementById("req-upper")?.classList.toggle("valid", reqs.upper);
    document.getElementById("req-lower")?.classList.toggle("valid", reqs.lower);
    document.getElementById("req-number")?.classList.toggle("valid", reqs.number);

    return Object.values(reqs).every(Boolean);
}
