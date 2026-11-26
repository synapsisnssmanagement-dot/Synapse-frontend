import { toast } from "sonner";

export const AUTH_KEYS = ["token", "role", "email", "name", "id"];

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// Reads the user id from the JWT payload. Display-only (e.g. "is this my
// message?"); the server never trusts it.
export function getUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.id ? String(payload.id) : null;
  } catch {
    return null;
  }
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function clearSession() {
  if (typeof window === "undefined") return;
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  // Offline attendance queues hold volunteer names and attendance: never leave
  // them on a shared device after sign-out.
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("synapsis.offline."))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable
  }
  try {
    // Unregister the field-attendance worker first so it can't re-populate its
    // caches while the next page loads, then delete the caches.
    const unregister =
      typeof navigator !== "undefined" && navigator.serviceWorker
        ? navigator.serviceWorker.getRegistrations().then((rs) => Promise.all(rs.filter((r) => (r.active || r.waiting || r.installing)?.scriptURL.endsWith("/field-sw.js")).map((r) => r.unregister())))
        : Promise.resolve();
    if (typeof caches !== "undefined") {
      unregister
        .catch(() => {})
        .then(() => caches.keys())
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith("synapsis-field-")).map((k) => caches.delete(k))));
    }
  } catch {
    // Cache API unavailable
  }
}

// Full reload rather than router.replace: SocketProvider reads the token once on
// mount, so crossing an auth boundary must re-mount it to drop the stale socket auth.
export function logout({ redirectTo = "/login", delay = 1200 } = {}) {
  clearSession();
  toast.success("You have been logged out");
  setTimeout(() => {
    window.location.href = redirectTo;
  }, delay);
}
