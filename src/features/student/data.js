"use client";

import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { LEVELS } from "@/components/ui/Badge";

export function useMyEvents() {
  return useResource(() => api.get("/api/students/my-events").then((res) => res.data?.events || []), []);
}

export function useStudentProfile() {
  return useResource(() => api.get("/api/students/profile").then((res) => res.data?.student || null), []);
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

// Level thresholds mirror the backend's completeEvent rules.
export function levelProgress(hours = 0) {
  const current = [...LEVELS].reverse().find((l) => hours >= l.minHours && (l.minHours > 0 || hours > 0)) || null;
  const next = LEVELS.find((l) => l.minHours > hours) || null;
  const floor = current?.minHours || 0;
  const pct = next ? Math.min(100, ((hours - floor) / (next.minHours - floor)) * 100) : 100;
  return { current, next, pct };
}
