"use client";

import { CheckCircle2, Clock3, CornerUpLeft, FileEdit, XCircle, AlertTriangle, Search as SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

// Durations are stored as integer minutes; shown as "3 h 20 min".
export function formatMinutes(min = 0) {
  const sign = min < 0 ? "−" : "";
  const m = Math.abs(Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${sign}${r} min`;
  return `${sign}${h} h${r ? ` ${r} min` : ""}`;
}
export const hours = (min = 0) => Math.round((min / 60) * 10) / 10;

const STATES = {
  draft: ["neutral", FileEdit, "Draft"],
  submitted: ["warning", Clock3, "Awaiting review"],
  approved: ["success", CheckCircle2, "Approved"],
  returned: ["info", CornerUpLeft, "Returned for changes"],
  rejected: ["danger", XCircle, "Rejected"],
  open: ["warning", Clock3, "Open"],
  under_review: ["info", SearchIcon, "Under review"],
  escalated: ["danger", AlertTriangle, "Escalated"],
  upheld: ["success", CheckCircle2, "Upheld"],
  dismissed: ["neutral", XCircle, "Dismissed"],
  withdrawn: ["neutral", XCircle, "Withdrawn"],
  active: ["success", CheckCircle2, "Active"],
  retired: ["neutral", XCircle, "Retired"],
  pending_review: ["warning", Clock3, "Awaiting review"],
  issued: ["success", CheckCircle2, "Issued"],
  revoked: ["danger", XCircle, "Revoked"],
  superseded: ["neutral", CornerUpLeft, "Superseded"],
};
export function StateBadge({ state }) {
  const [tone, Icon, label] = STATES[state] || ["neutral", null, state];
  return (
    <Badge tone={tone} icon={Icon}>
      {label}
    </Badge>
  );
}

export const REQUIREMENT_LABEL = {
  national: "National NSS certificate (as configured by your institution)",
  local_academic: "Institution academic completion",
  benefit: "Grace mark / benefit eligibility",
};

export const GRIEVANCE_LABEL = {
  missing_attendance: "Missing attendance",
  missing_hours: "Missing hours",
  incorrect_duration: "Incorrect approved duration",
  category: "Wrong category",
  returned_or_rejected: "Returned or rejected claim",
};

// Random client operation id so a retried correction is applied once.
export const opId = () => `op-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

// Authenticated PDF: fetch as a blob and open it in a new tab.
export async function openPdf(api, url) {
  const res = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(res.data);
  window.open(href, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(href), 60000);
}
