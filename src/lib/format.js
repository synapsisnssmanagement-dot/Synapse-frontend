import { formatDistanceToNowStrict } from "date-fns";

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, style = "medium") {
  const date = toDate(value);
  if (!date) return "—";
  const options = {
    short: { day: "numeric", month: "short" },
    medium: { day: "numeric", month: "short", year: "numeric" },
    long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    time: { hour: "numeric", minute: "2-digit" },
    datetime: { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" },
  }[style];
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

export function timeAgo(value) {
  const date = toDate(value);
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : "";
}

export function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
}

export function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

// Profile images arrive either as a URL string or as { url, public_id }.
export function photoOf(person) {
  const image = person?.profileImage;
  if (!image) return null;
  return typeof image === "string" ? image : image.url || null;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "";
}
