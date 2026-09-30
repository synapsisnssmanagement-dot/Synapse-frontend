"use client";

import useResource from "@/hooks/useResource";
import api from "@/lib/api";

export function useAlumniDashboard() {
  return useResource(() => api.get("/api/alumni/dashboard").then((res) => res.data?.data || null), []);
}

export function useMentees() {
  return useResource(() => api.get("/api/mentorship/mentor").then((res) => res.data?.requests || []), []);
}

export function useMenteeFeedback() {
  return useResource(() => api.get("/api/mentorship/mentee-feedback/all").then((res) => res.data?.feedbacks || []), []);
}

export function averageRating(feedbacks = []) {
  const rated = feedbacks.filter((f) => f.feedback?.rating);
  if (!rated.length) return null;
  return rated.reduce((sum, f) => sum + f.feedback.rating, 0) / rated.length;
}
