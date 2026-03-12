import { scanPlant } from "../services/api.service.js";
import { getAdvice } from "../diseaseAdvice.js";
import { compressImageToBase64, saveScanRecord } from "../services/scan.service.js"; // ✅ uploadScanImage replaced
import { auth } from "../services/auth.service.js";

// ── Spinner overlay helpers ───────────────────────────────────────────────────

function showOverlay(message = "Analysing leaf…") {
    const overlay = document.getElementById("scan-overlay");
    const msg = document.getElementById("scan-overlay-msg");
    if (!overlay) return;
    if (msg) msg.textContent = message;
    overlay.classList.remove("hidden");
}

function updateOverlayMsg(message) {
    const msg = document.getElementById("scan-overlay-msg");
    if (msg) msg.textContent = message;
}

function hideOverlay() {
    document.getElementById("scan-overlay")?.classList.add("hidden");
}

// ── Home view init ────────────────────────────────────────────────────────────

export function initHomeView() {
    const scanBtn = document.getElementById("camera-trigger");
    if (!scanBtn) return;

    const fileInput = Object.assign(document.createElement("input"), {
        type: "file",
        id: "file-input",
        accept: "image/*",
        style: "display:none"
    });
    document.body.appendChild(fileInput);

    scanBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        showOverlay("Analysing your leaf…");

        try {
            // 1. Get prediction from ML backend
            const result = await scanPlant(file);
            const classLabel = result.predictions?.[0]?.class
                ?? result.class
                ?? result.diagnosis
                ?? result.name
                ?? "Unknown";

            // 2. Map label → friendly name + advice
            const { name, advice } = getAdvice(classLabel);

            // 3. ✅ Compress image to base64 thumbnail (no Storage needed)
            const uid = auth.currentUser?.uid;
            let imageThumbnail = "";

            if (uid) {
                try {
                    updateOverlayMsg("Saving scan to history…");
                    imageThumbnail = await compressImageToBase64(file); // ✅ replaces uploadScanImage
                } catch (compressErr) {
                    console.warn("Image compression failed:", compressErr.message);
                }

                // 4. Save record to Firestore (image embedded as base64)
                try {
                    await saveScanRecord({ userId: uid, imageThumbnail, diagnosis: name, advice });
                } catch (dbErr) {
                    console.warn("Firestore save failed:", dbErr.message);
                }
            }

            // 5. Hide overlay and show result card
            hideOverlay();
            // ✅ For the live preview we still use object URL (instant, no cost)
            showResultCard({ name, advice, imageURL: URL.createObjectURL(file) });

        } catch (err) {
            hideOverlay();
            console.error(err);
            alert("Error scanning: " + err.message);
        } finally {
            fileInput.value = "";
        }
    });
}

/** Update the username greeting on the home screen */
export function updateHomeGreeting(username) {
    const el = document.getElementById("home-username");
    if (el) el.textContent = username;
}

// ── Result card ───────────────────────────────────────────────────────────────

function showResultCard({ name, advice, imageURL }) {
    document.getElementById("result-card")?.remove();

    const card = document.createElement("div");
    card.id = "result-card";
    card.className = "result-card";
    card.innerHTML = `
        <div class="result-card-header">
            <img src="${imageURL}" class="result-thumb" alt="Scanned leaf" />
            <div class="result-header-text">
                <span class="result-label">Diagnosis</span>
                <h3 class="result-name">${name}</h3>
            </div>
            <button class="result-close" id="result-close-btn" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="result-advice">
            <i class="fa-solid fa-circle-info result-advice-icon"></i>
            <p>${advice}</p>
        </div>
    `;

    const cameraCard = document.getElementById("camera-trigger");
    cameraCard?.insertAdjacentElement("afterend", card);

    document.getElementById("result-close-btn")?.addEventListener("click", () => {
        card.remove();
    });

    requestAnimationFrame(() => card.classList.add("result-card--visible"));
}