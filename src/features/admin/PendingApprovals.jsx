"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ApprovalQueue from "./ApprovalQueue";
import { PEOPLE_ORDER } from "./people";

function PendingApprovalsInner() {
  const params = useSearchParams();
  const requested = params.get("role");
  const role = PEOPLE_ORDER.includes(requested) ? requested : "student";
  return <ApprovalQueue role={role} />;
}

export default function PendingApprovals() {
  return (
    <Suspense>
      <PendingApprovalsInner />
    </Suspense>
  );
}
