import { scanPlant } from "../services/api.service.js";
import { getAdvice } from "../diseaseAdvice.js";
import { compressImageToBase64, saveScanRecord, getRecentScans } from "../services/scan.service.js";
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

            // 3. Compress image to base64 thumbnail (no Storage needed)
            const uid = auth.currentUser?.uid;
            let imageThumbnail = "";

            if (uid) {
                try {
                    updateOverlayMsg("Saving scan to history…");
                    imageThumbnail = await compressImageToBase64(file);
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
            showResultCard({ name, advice, imageURL: URL.createObjectURL(file) });

            // 6. Auto-refresh Recent Advice section
            renderRecentAdvice();

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

// ── Recent Advice ─────────────────────────────────────────────────────────────

/**
 * Fetches the 3 most recent scans and renders them as advice cards
 * in the #recent-advice-list container on the Home view.
 */
export async function renderRecentAdvice() {
    const container = document.getElementById("recent-advice-list");
    if (!container) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
        container.innerHTML = renderEmptyState();
        return;
    }

    // Loading skeleton
    container.innerHTML = `
        <div class="advice-card advice-card--loading">
            <div class="advice-shimmer"></div>
            <div class="advice-shimmer advice-shimmer--short"></div>
        </div>
    `;

    try {
        const scans = await getRecentScans(uid);

        if (scans.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        container.innerHTML = scans.map((scan, i) => {
            const diagnosis = scan.diagnosis ?? "Unknown";
            const advice = scan.advice ?? "";
            // Choose an icon based on diagnosis content
            const isHealthy = diagnosis.toLowerCase().includes("healthy");
            const iconClass = isHealthy
                ? "fa-solid fa-circle-check"
                : "fa-solid fa-circle-info";
            const iconColor = isHealthy
                ? "var(--primary-green)"
                : "#e67e22";

            return `
                <div class="advice-card" style="animation-delay: ${i * 0.08}s">
                    <i class="${iconClass}"
                       style="color: ${iconColor}; font-size: 1.4rem; flex-shrink: 0;"></i>
                    <div style="min-width: 0;">
                        <p style="font-weight: 600; margin: 0; color: var(--dark-green);">
                            ${diagnosis}
                        </p>
                        <small style="color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${advice}
                        </small>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Failed to load recent advice:", err);
        container.innerHTML = renderEmptyState();
    }
}

function renderEmptyState() {
    return `
        <div class="advice-card advice-card--empty">
            <i class="fa-solid fa-seedling"
               style="color: var(--accent-leaf); font-size: 1.4rem; flex-shrink: 0;"></i>
            <div>
                <p style="font-weight: 500; margin: 0; color: var(--dark-green);">
                    No recent scans yet
                </p>
                <small style="color: var(--text-muted);">
                    Tap the button above to identify your first plant!
                </small>
            </div>
        </div>
    `;
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