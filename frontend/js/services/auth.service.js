import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { app as firebaseApp } from "../firebase.init.js";

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/**
 * Register a new user with email + password
 */
export async function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in an existing user
 */
export async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user
 */
export async function logout() {
    return signOut(auth);
}

/**
 * Sign in anonymously (for demo/guest users).
 * Each device gets a unique anonymous UID with isolated data.
 */
export async function loginAnonymous() {
    return signInAnonymously(auth);
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Create a user document in Firestore
 */
export async function createUserDoc(uid, { email, username }) {
    return setDoc(doc(db, "users", uid), {
        email,
        username,
        verified: false,
        createdAt: serverTimestamp()
    });
}

/**
 * Fetch a user document from Firestore
 */
export async function getUserDoc(uid) {
    return getDoc(doc(db, "users", uid));
}

/**
 * Mark a user as verified in Firestore
 */
export async function markVerified(uid) {
    return setDoc(doc(db, "users", uid), { verified: true }, { merge: true });
}
