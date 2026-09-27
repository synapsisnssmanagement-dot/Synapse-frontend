"use client";

import useResource from "@/hooks/useResource";
import api from "@/lib/api";

export function useMyEvents() {
  return useResource(() => api.get("/api/teacher/teachermyevents").then((res) => res.data?.data || []), []);
}

export const STATUS_ORDER = { Ongoing: 0, Upcoming: 1, Completed: 2, Cancelled: 3 };

export function sortEvents(events = []) {
  return [...events].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4);
    if (s) return s;
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return a.status === "Completed" ? db - da : da - db;
  });
}
