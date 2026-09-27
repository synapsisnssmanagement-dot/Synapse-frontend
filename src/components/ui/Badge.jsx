import { Ban, CalendarClock, CheckCircle2, Clock3, XCircle } from "lucide-react";
import cx from "@/lib/cx";

const tones = {
  success: "border-brand/25 bg-mint text-brand-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-line bg-canvas text-fg-2",
  dark: "border-ink bg-ink text-on-dark",
  live: "border-brand/30 bg-brand/10 text-brand-700",
  bronze: "border-orange-200 bg-orange-50 text-orange-800",
  silver: "border-slate-300 bg-slate-100 text-slate-700",
  gold: "border-amber-300 bg-amber-50 text-amber-800",
  platinum: "border-ink bg-ink text-white",
};

export const LEVELS = [
  { name: "Bronze", minHours: 0 },
  { name: "Silver", minHours: 11 },
  { name: "Gold", minHours: 26 },
  { name: "Platinum", minHours: 50 },
];

export function LevelBadge({ level, size, className }) {
  const name = String(level || "").trim();
  const tone = name.toLowerCase();
  if (!tones[tone]) return null;
  return (
    <Badge tone={tone} size={size} className={className}>
      {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
    </Badge>
  );
}

export function Badge({ tone = "neutral", icon: Icon, className, children, size = "md" }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm border font-semibold",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        tones[tone],
        className
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
      {children}
    </span>
  );
}

const STATUS = {
  approved: ["success", CheckCircle2],
  accepted: ["success", CheckCircle2],
  active: ["success", CheckCircle2],
  completed: ["success", CheckCircle2],
  present: ["success", CheckCircle2],
  verified: ["success", CheckCircle2],
  paid: ["success", CheckCircle2],
  succeeded: ["success", CheckCircle2],
  pending: ["warning", Clock3],
  requested: ["warning", Clock3],
  "in review": ["warning", Clock3],
  upcoming: ["info", CalendarClock],
  scheduled: ["info", CalendarClock],
  ongoing: ["live", null],
  live: ["live", null],
  rejected: ["danger", XCircle],
  declined: ["danger", XCircle],
  absent: ["danger", XCircle],
  cancelled: ["danger", XCircle],
  failed: ["danger", XCircle],
  blocked: ["danger", Ban],
  inactive: ["neutral", Ban],
};

// Status is always communicated by icon + text, never by colour alone.
export function StatusBadge({ status, label, size, className }) {
  const key = String(status || "").trim().toLowerCase();
  const [tone, Icon] = STATUS[key] || ["neutral", null];
  const text = label || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "Unknown");
  return (
    <Badge tone={tone} icon={Icon} size={size} className={className}>
      {tone === "live" ? <span aria-hidden="true" className="mr-0.5 size-1.5 animate-pulse-dot rounded-full bg-brand" /> : null}
      {text}
    </Badge>
  );
}
