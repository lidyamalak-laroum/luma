/**
 * scan.service.js
 * ✅ Storage-free version: compresses the image to a base64 thumbnail
 *    and saves it directly inside the Firestore scan document.
 *    No Firebase Storage bucket needed at all.
 */

import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { app as firebaseApp } from "../firebase.init.js";

const db = getFirestore(firebaseApp);

// ── Image → Base64 Thumbnail ──────────────────────────────────────────────────

/**
 * Compresses an image File to a small base64 JPEG thumbnail.
 * Keeps it tiny (max 300px wide) so it fits comfortably in Firestore (1MB doc limit).
 *
 * @param {File} file - The image file from the file input
 * @param {number} maxWidth - Max thumbnail width in px (default 300)
 * @returns {Promise<string>} base64 data URL  e.g. "data:image/jpeg;base64,..."
 */
export function compressImageToBase64(file, maxWidth = 300) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectURL = URL.createObjectURL(file);

        img.onload = () => {
            // Calculate scaled dimensions
            const scale = Math.min(1, maxWidth / img.width);
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);

            URL.revokeObjectURL(objectURL);
            resolve(canvas.toDataURL("image/jpeg", 0.7)); // 70% quality JPEG
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            reject(new Error("Failed to load image for compression"));
        };

        img.src = objectURL;
    });
}

// ── Firestore: Save ───────────────────────────────────────────────────────────

/**
 * Saves a completed scan record to the `scan_history` Firestore collection.
 * imageThumbnail is a base64 string stored directly in the document.
 *
 * @param {{ userId: string, imageThumbnail: string, diagnosis: string, advice: string }} record
 * @returns {Promise<DocumentReference>}
 */
export async function saveScanRecord({ userId, imageThumbnail, diagnosis, advice }) {
    return addDoc(collection(db, "scan_history"), {
        userId,
        imageURL: imageThumbnail, // kept as "imageURL" so history view still works unchanged
        diagnosis,
        advice,
        timestamp: serverTimestamp()
    });
}

// ── Firestore: Fetch ──────────────────────────────────────────────────────────

/**
 * Fetches the 20 most recent scan records for a given user.
 * @param {string} uid
 * @returns {Promise<Array<{id, imageURL, diagnosis, advice, timestamp}>>}
 */
export async function getUserScans(uid) {
    const q = query(
        collection(db, "scan_history"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc"),
        limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}