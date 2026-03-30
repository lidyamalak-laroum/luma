// Base URL for all backend API calls
const BASE_URL = "luma-production-fb3e.up.railway.app";

/**
 * Send verification code to user's email
 * @param {string} uid - Firebase user UID
 * @param {string} email - User's email address
 */
export async function sendCode(uid, email) {
    const res = await fetch(`${BASE_URL}/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email })
    });
    return res.json();
}

/**
 * Verify a code submitted by the user
 * @param {string} uid - Firebase user UID
 * @param {string} code - Code entered by user
 */
export async function verifyCode(uid, code) {
    const res = await fetch(`${BASE_URL}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, code })
    });
    return res.json();
}

/**
 * Send plant image to ML backend for disease classification
 * @param {File} imageFile - The image File object
 */
export async function scanPlant(imageFile) {
    const fd = new FormData();
    fd.append("image", imageFile);
    const res = await fetch(`${BASE_URL}/scan`, {
        method: "POST",
        body: fd
    });
    if (!res.ok) throw new Error("Scan failed");
    return res.json();
}
