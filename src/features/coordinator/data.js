"use client";

import useResource from "@/hooks/useResource";
import api, { getList } from "@/lib/api";

export function useMyEvents() {
  return useResource(() => getList("/api/coordinator/my-events", "events"), []);
}

export function useCoordinatorProfile() {
  return useResource(() => api.get("/api/coordinator/profile").then((res) => res.data?.data || null), []);
}

export const STATUS_ORDER = { Ongoing: 0, Upcoming: 1, Completed: 2, Cancelled: 3 };

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isPast(event) {
  return event?.date ? new Date(event.date) < startOfToday() : false;
}

export function isToday(event) {
  if (!event?.date) return false;
  const d = new Date(event.date);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

export function presentCount(event) {
  return (event?.attendance || []).filter((a) => a.status === "Present").length;
}

export function participantCount(event) {
  return Array.isArray(event?.participants) ? event.participants.length : 0;
}

export function teacherCount(event) {
  return Array.isArray(event?.assignedTeacher) ? event.assignedTeacher.length : 0;
}

// Hours actually delivered: each present volunteer earns the event's measured hours.
export function deliveredHours(event) {
  if (event?.status !== "Completed") return 0;
  const hours = Number(event.calculatedHours) || Number(event.hours) || 0;
  return hours * presentCount(event);
}

export function sortEvents(events = []) {
  return [...events].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4);
    if (s) return s;
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return a.status === "Completed" ? db - da : da - db;
  });
}

// Operational problems worth a coordinator's attention, most urgent first.
export function attentionItems(events = []) {
  const items = [];
  events.forEach((event) => {
    if (event.status === "Upcoming" && isPast(event)) {
      items.push({ event, tone: "danger", text: "Date has passed but the event was never started." });
    } else if (event.status === "Ongoing" && isPast(event)) {
      items.push({ event, tone: "warning", text: "Still marked ongoing — complete it to credit volunteer hours." });
    }
    if (event.status !== "Completed" && event.status !== "Cancelled") {
      if (!teacherCount(event)) items.push({ event, tone: "warning", text: "No teacher assigned to take attendance." });
      if (!participantCount(event)) items.push({ event, tone: "info", text: "No volunteers assigned yet." });
    }
  });
  const rank = { danger: 0, warning: 1, info: 2 };
  return items.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

export { api };
