import { getUserScans } from "../services/scan.service.js";
import { auth } from "../services/auth.service.js";

export function initHistoryView() {
  // History is rendered on demand via renderHistory()
}

/**
 * Fetches the current user's scan history from Firestore
 * and renders it as rich cards in the history view.
 */
export async function renderHistory() {
  const list = document.getElementById("history-list");
  if (!list) return;

  const uid = auth.currentUser?.uid;
  if (!uid) {
    list.innerHTML = `<p style="color:var(--text-muted);text-align:center;margin-top:20px;">Please log in to view your history.</p>`;
    return;
  }

  // Show a loading state
  list.innerHTML = `
        <div style="text-align:center;margin-top:30px;color:var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem;"></i>
            <p style="margin-top:10px;">Loading history...</p>
        </div>
    `;

  try {
    const scans = await getUserScans(uid);

    if (scans.length === 0) {
      list.innerHTML = `
                <div style="text-align:center;margin-top:40px;color:var(--text-muted);">
                    <i class="fa-solid fa-leaf" style="font-size:2.5rem;opacity:0.4;"></i>
                    <p style="margin-top:12px;">No scans yet. Tap the camera to get started.</p>
                </div>
            `;
      return;
    }

    list.innerHTML = scans.map((scan) => {
      const date = scan.timestamp?.toDate
        ? scan.timestamp.toDate().toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric"
        })
        : "—";

      const imgHTML = scan.imageURL
        ? `<img src="${scan.imageURL}" class="history-thumb" alt="${scan.diagnosis}" loading="lazy" />`
        : `<div class="history-thumb history-thumb--placeholder"><i class="fa-solid fa-leaf"></i></div>`;

      return `
                <div class="history-card">
                    ${imgHTML}
                    <div class="history-info">
                        <strong class="history-diagnosis">${scan.diagnosis ?? "Unknown"}</strong>
                        <p class="history-advice">${scan.advice ?? ""}</p>
                        <small class="history-date">
                            <i class="fa-regular fa-calendar"></i> ${date}
                        </small>
                    </div>
                </div>
            `;
    }).join("");

  } catch (err) {
    console.error("Failed to load history:", err);
    list.innerHTML = `
            <div style="text-align:center;margin-top:30px;color:var(--text-muted);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:1.5rem;color:var(--danger-red);"></i>
                <p style="margin-top:10px;">Could not load history. Please try again.</p>
            </div>
        `;
  }
}
