/**
 * Shared application state flags.
 * Used to coordinate between views and the main auth listener.
 */

// Set to true right before registering a new user so that
// the onAuthChange handler knows to show the verify view
// instead of signing the unverified user out.
export let justRegistered = false;

export function setJustRegistered(value) {
    justRegistered = value;
}
