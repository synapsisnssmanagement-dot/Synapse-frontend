"use client";

import useResource from "@/hooks/useResource";
import api from "@/lib/api";

// Verified (ledger) hours for the signed-in volunteer; null for non-volunteers.
export default function useVerifiedHours() {
  const r = useResource(
    () =>
      api
        .get("/api/ops/passbook/me")
        .then((res) => res.data.summary)
        .catch((e) => (e.response?.status === 403 ? null : Promise.reject(e))),
    []
  );
  const s = r.data;
  return {
    ...r,
    verified: s ? Math.round(((s.verifiedRegularMinutes + s.verifiedCampMinutes) / 60) * 10) / 10 : 0,
    pending: s ? Math.round((s.pendingMinutes / 60) * 10) / 10 : 0,
    legacy: s ? Math.round((s.legacyMinutes / 60) * 10) / 10 : 0,
  };
}
