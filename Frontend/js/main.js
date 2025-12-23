// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyAk-_3F4XmA5XSiqhIcEWD9lmRcAHPkrG4",
    authDomain: "luma-fbe9b.firebaseapp.com",
    projectId: "luma-fbe9b",
    storageBucket: "luma-fbe9b.appspot.com",
    messagingSenderId: "1042959332832",
    appId: "1:1042959332832:web:1caedef8f1fa4fd8fce785"
};

// ================= INIT =================
const appInstance = initializeApp(firebaseConfig);
const auth = getAuth(appInstance);
const db = getFirestore(appInstance);

// ================= APP =================
const app = {
    state: {
        currentUser: null,
        history: []
    },

    init() {
        app.router.init();
        app.auth.init();
        app.ui.init();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                app.state.currentUser = user;

                const snap = await getDoc(doc(db, "users", user.uid));
                const data = snap.data();

                if (!data?.verified) {
                    app.router.navigate("verify");
                    return;
                }

                // Store full user data in state
                app.state.userData = data;

                app.router.navigate("home");
                app.data.subscribeToHistory();
                app.ui.updateHome();
                app.ui.updateSettings();
            } else {
                app.state.currentUser = null;
                app.router.navigate("login");
            }
        });
    },

    // ================= ROUTER =================
    router: {
        currentView: null,

        init() {
            document.querySelectorAll(".nav-item").forEach(item => {
                item.addEventListener("click", () => {
                    app.router.navigate(item.dataset.target);
                });
            });
        },

        navigate(view) {
            document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
            document.getElementById(`view-${view}`).classList.add("active");
            this.currentView = view;

            // Handle Navbar Visibility
            const nav = document.getElementById("main-nav");
            if (["login", "register", "verify"].includes(view)) {
                nav.classList.add("hidden");
            } else {
                nav.classList.remove("hidden");
                // Update active state
                document.querySelectorAll(".nav-item").forEach(item => {
                    item.classList.toggle("active", item.dataset.target === view);
                });
            }
        }
    },

    // ================= AUTH =================
    auth: {
        init() {
            // LOGIN
            document.getElementById("login-form").addEventListener("submit", async e => {
                e.preventDefault();
                const email = document.getElementById("login-email").value;
                const password = document.getElementById("login-password").value;
                try {
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );
                } catch (err) {
                    alert(err.message);
                }
            });

            // Navigation Buttons
            const btnRegister = document.getElementById('btn-go-to-register');
            if (btnRegister) {
                btnRegister.addEventListener('click', () => {
                    app.router.navigate('register');
                });
            }

            const btnLogin = document.getElementById('btn-go-to-login');
            if (btnLogin) {
                btnLogin.addEventListener('click', () => {
                    app.router.navigate('login');
                });
            }

            // Password Toggle Logic
            document.querySelectorAll('.toggle-password').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const targetId = icon.getAttribute('data-target');
                    const input = document.getElementById(targetId);

                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                });
            });

            // Register Password Validation Logic
            const passInput = document.getElementById('reg-password');
            if (passInput) {
                passInput.addEventListener('input', (e) => app.auth.validatePassword(e.target.value));
            }

            // REGISTER
            document.getElementById("register-form").addEventListener("submit", async e => {
                e.preventDefault();

                const email = document.getElementById("reg-email").value;
                const pass = document.getElementById("reg-password").value;
                const username = document
               .getElementById("reg-username")
               .value
               .trim();

                // Validate before submitting
                if (!app.auth.validatePassword(pass)) {
                    alert("Please meet all password requirements.");
                    return;
                }

                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, pass);
                    const user = cred.user;

                    await setDoc(doc(db, "users", user.uid), {
                        email,
                        username,
                        verified: false,
                        createdAt: serverTimestamp()
                    });

                    await fetch("http://localhost:5000/api/send-code", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ uid: user.uid, email })
                    });

                    app.router.navigate("verify");
                } catch (err) {
                    if (err.code === "auth/email-already-in-use" || err.message.includes("email-already-in-use")) {
                        // If user exists, try to login or just move to verify if potentially unverified?
                        // Better UX: Tell them to login.
                        alert("Account already exists. Please log in.");
                        app.router.navigate("login");
                    } else if (err.code === "permission-denied" || err.message.includes("Missing or insufficient permissions")) {
                        // CRITICAL: Firestore rules issue
                        alert("Database Permission Error: Please update your Firestore Security Rules in the Firebase Console to allow writes.");
                    } else {
                        alert(err.message);
                    }
                }
            });

            // VERIFY
            document.getElementById("verify-form").addEventListener("submit", async e => {
                e.preventDefault();
                const codeInput = document.getElementById("verify-code");
                const errorMsg = document.getElementById("verify-error");

                const res = await fetch("http://localhost:5000/api/verify-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        uid: auth.currentUser.uid,
                        code: codeInput.value
                    })
                });

                const data = await res.json();

                if (data.success) {
                    await setDoc(
                        doc(db, "users", auth.currentUser.uid),
                        { verified: true },
                        { merge: true }
                    );
                    app.router.navigate("home");
                } else {
                    errorMsg.style.display = "block";
                }
            });

            // LOGOUT
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                    app.auth.logout();
                });
            }
        },

        logout() {
            signOut(auth);
        },

        validatePassword: (password) => {
            const reqs = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /[0-9]/.test(password)
            };
            const reqLength = document.getElementById('req-length');
            if (reqLength) reqLength.classList.toggle('valid', reqs.length); // Assuming CSS has .valid { color: green } or similar

            const reqUpper = document.getElementById('req-upper');
            if (reqUpper) reqUpper.classList.toggle('valid', reqs.upper);

            const reqLower = document.getElementById('req-lower');
            if (reqLower) reqLower.classList.toggle('valid', reqs.lower);

            const reqNumber = document.getElementById('req-number');
            if (reqNumber) reqNumber.classList.toggle('valid', reqs.number);

            return Object.values(reqs).every(r => r);
        }
    },

    // ================= DATA =================
    data: {
        subscribeToHistory() {
            const q = query(
                collection(db, `users/${app.state.currentUser.uid}/scans`),
                orderBy("timestamp", "desc")
            );

            onSnapshot(q, snap => {
                app.state.history = [];
                snap.forEach(doc => app.state.history.push(doc.data()));
                app.ui.renderHistory();
            });
        },

        async addScan(result) {
            await addDoc(
                collection(db, `users/${app.state.currentUser.uid}/scans`),
                {
                    ...result,
                    timestamp: serverTimestamp(),
                    dateString: new Date().toLocaleString()
                }
            );
        }
    },

    // ================= UI =================
    ui: {
        init() {
            // Dark Mode Toggle
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) {
                themeBtn.addEventListener('click', () => {
                    document.body.classList.toggle('dark-mode');

                    // Toggle Icon
                    if (document.body.classList.contains('dark-mode')) {
                        themeBtn.classList.remove('fa-moon');
                        themeBtn.classList.add('fa-sun');
                    } else {
                        themeBtn.classList.remove('fa-sun');
                        themeBtn.classList.add('fa-moon');
                    }
                });
            }

            // Scanner Logic - handle safely
            const scanBtn = document.getElementById("scan-btn") || document.getElementById("camera-trigger");

            if (scanBtn) {
                // Ensure there's a file input
                let fileInput = document.getElementById("file-input");
                if (!fileInput) {
                    fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.id = "file-input";
                    fileInput.style.display = "none";
                    document.body.appendChild(fileInput);
                }

                // Trigger file select on button click
                scanBtn.addEventListener("click", () => {
                    fileInput.click();
                });

                // Handle file selection
                fileInput.addEventListener("change", async () => {
                    const file = fileInput.files[0];
                    if (!file) return;

                    const fd = new FormData();
                    fd.append("image", file);

                    try {
                        const originalText = scanBtn.innerHTML;
                        if (scanBtn.id === 'camera-trigger') scanBtn.innerHTML = '<h3>Scanning...</h3>';

                        const res = await fetch("http://localhost:5000/api/scan", {
                            method: "POST",
                            body: fd
                        });

                        // Restore text
                        scanBtn.innerHTML = originalText;

                        if (!res.ok) throw new Error("Scan failed");
                        const data = await res.json();

                        // Normalize data
                        const resultName = data.name || data.diagnosis || "Unknown";
                        await app.data.addScan(data);
                        alert(`Result: ${resultName}`);

                    } catch (error) {
                        console.error(error);
                        alert("Error scanning: " + error.message);
                    }
                });
            }
        },

        updateSettings: () => {
            if (!app.state.currentUser || !app.state.userData) return;

    document.getElementById('settings-username').textContent =
        app.state.userData.username;

    document.getElementById('settings-email').textContent =
        app.state.currentUser.email;

        },

        updateHome() {
           if (!app.state.currentUser || !app.state.userData) return;

    document.getElementById("home-username").textContent =
        app.state.userData.username;
        },

        renderHistory() {
            const historyList = document.getElementById("history-list");
            historyList.innerHTML = "";
            app.state.history.forEach(h => {
                historyList.innerHTML += `
          <div class="history-item">
            <strong>${h.diagnosis}</strong>
            <small>${h.dateString}</small>
          </div>
        `;
            });
        }
    }
};

// ================= START =================
document.addEventListener("DOMContentLoaded", app.init);

