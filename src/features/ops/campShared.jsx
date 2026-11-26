"use client";

import { Badge } from "@/components/ui/Badge";

const TONE = { draft: "neutral", submitted: "warning", approved: "info", in_progress: "live", completed: "success", reviewed: "success", rejected: "danger", cancelled: "danger" };
export function CampStatus({ status }) {
  return <Badge tone={TONE[status] || "neutral"}>{String(status).replace(/_/g, " ")}</Badge>;
}
export const rupees = (paise = 0) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
