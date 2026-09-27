// Deployed backend. Used when no env var is set, so a production build can
// never silently fall back to an unreachable host; local dev overrides both
// via .env.local.
const DEPLOYED_BACKEND = "https://synapse-backend-ijri.onrender.com";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || DEPLOYED_BACKEND;
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || DEPLOYED_BACKEND;
