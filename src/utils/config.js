// Deployed backend – the canonical production API origin.
const DEPLOYED_BACKEND = "https://synapse-backend-ijri.onrender.com";

// Detect production: Vercel sets NEXT_PUBLIC_VERCEL_URL automatically.
// When running on Vercel (or any non-localhost build), always use the deployed
// backend so a stale env var can never leak "localhost" into a production build.
const isProduction = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.NODE_ENV === "production";

export const API_URL = isProduction
  ? DEPLOYED_BACKEND
  : (process.env.NEXT_PUBLIC_API_URL || DEPLOYED_BACKEND);

export const SOCKET_URL = isProduction
  ? DEPLOYED_BACKEND
  : (process.env.NEXT_PUBLIC_SOCKET_URL || DEPLOYED_BACKEND);
