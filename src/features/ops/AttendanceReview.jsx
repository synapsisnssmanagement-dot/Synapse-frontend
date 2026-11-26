"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPinOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";

const t = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const snap = (s) => `${s.status}${s.minutes != null ? `, ${s.minutes} min` : ""} (${t(s.checkInAt)}–${t(s.checkOutAt)})`;

function Correct({ rec, onClose, onDone }) {
  const [status, setStatus] = useState(rec?.status || "present");
  const [minutes, setMinutes] = useState(rec?.minutes ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!rec) return null;
  const go = async () => {
    setBusy(true);
    try {
      await api.post(`/api/ops/attendance/${rec._id}/correct`, { status, minutes: minutes === "" ? undefined : Number(minutes), reason, rev: rec.rev });
      toast.success("Correction recorded");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={busy ? () => {} : onClose} title={`Correct attendance — ${rec.student?.name}`} description="The previous values are kept in the record's correction history." footer={<Button variant="dark" onClick={go} loading={busy}>Save correction</Button>}>
      <div className="grid gap-3">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["present", "partial", "absent", "excused"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input label="Minutes taken part" type="number" min={0} max={1440} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <Textarea label="Reason (required)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}

export default function AttendanceReview() {
  const q = useResource(() => api.get("/api/ops/attendance/queue").then((r) => r.data.records), []);
  const [fix, setFix] = useState(null);
  const act = async (path, body, msg) => {
    try {
      await api.post(path, body);
      toast.success(msg);
      q.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const resolve = (rec, c, keep) => {
    const reason = window.prompt(`Reason for keeping the ${keep} version:`);
    if (reason) act(`/api/ops/attendance/${rec._id}/resolve`, { opId: c.opId, keep, reason }, "Conflict resolved");
  };
  return (
    <>
      <PageHeader eyebrow="Field" title="Attendance review" description="Self check-ins wait here for a supervisor. Location is shown as supporting evidence only; it can be wrong or spoofed. Offline conflicts show both versions." />
      {q.status === "error" ? (
        <ErrorState error={q.error} onRetry={q.reload} />
      ) : !q.data ? (
        <TableSkeleton />
      ) : q.data.length ? (
        <Panel padded={false}>
          <ul>
            {q.data.map((r) => (
              <li key={r._id} className="border-b border-line px-5 py-3 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-fg">
                      {r.student?.name} — {r.event?.title} · {r.sessionDate}
                    </p>
                    <p className="text-[13px] text-muted">
                      {snap(r)} · {r.method.replace(/_/g, " ")}
                      {r.geo?.distance != null ? ` · ${r.geo.distance} m from venue${r.geo.accuracy ? ` (±${Math.round(r.geo.accuracy)} m)` : ""}` : r.geo?.note ? ` · ${r.geo.note}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.verification === "disputed" ? <Badge tone="danger">Conflict</Badge> : <Badge tone="warning" icon={r.geo?.withinRadius ? undefined : MapPinOff}>Unverified</Badge>}
                    {r.verification === "unverified" ? (
                      <Button size="sm" variant="dark" icon={ShieldCheck} onClick={() => act(`/api/ops/attendance/${r._id}/verify`, {}, "Verified")}>
                        Verify
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => setFix(r)}>
                      Correct
                    </Button>
                  </div>
                </div>
                {(r.conflicts || [])
                  .filter((c) => !c.resolved)
                  .map((c) => (
                    <div key={c.opId} className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px]">
                      <p>Server: {snap(r)}</p>
                      <p>Offline device: {snap(c.incoming)}{c.capturedAt ? ` · captured ${new Date(c.capturedAt).toLocaleString()}` : ""}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => resolve(r, c, "server")}>
                          Keep server
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => resolve(r, c, "incoming")}>
                          Use offline version
                        </Button>
                      </div>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState icon={ShieldCheck} title="Nothing to review" description="Unverified check-ins and offline conflicts appear here." />
      )}
      <Correct rec={fix} onClose={() => setFix(null)} onDone={q.reload} />
    </>
  );
}
