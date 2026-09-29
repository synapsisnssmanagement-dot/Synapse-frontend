import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/utils/config";
import { clearSession, getToken } from "@/utils/auth";

export { errorMessage } from "./errors";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The backend only answers 401 from its auth middleware, so a 401 on a request
// that carried a token always means the session is no longer valid.
let endingSession = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && sentToken && !endingSession && typeof window !== "undefined") {
      endingSession = true;
      clearSession();
      toast.info("Your session has ended. Please sign in again.");
      // Full reload so the socket connection is rebuilt without the stale token.
      setTimeout(() => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload by design (see comment above)
        window.location.href = "/login";
      }, 900);
    }
    return Promise.reject(error);
  }
);

// Several list endpoints answer 404 instead of an empty array when nothing matches.
export async function getList(path, field, config) {
  try {
    const res = await api.get(path, config);
    const value = res.data?.[field];
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error.response?.status === 404) return [];
    throw error;
  }
}

export default api;
