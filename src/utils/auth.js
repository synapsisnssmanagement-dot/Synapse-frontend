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
