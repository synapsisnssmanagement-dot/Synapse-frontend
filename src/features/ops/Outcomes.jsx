"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import Panel from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

export default function Outcomes({ projectId, planned = [], sessions = [], canVerify }) {
  const r = useResource(() => api.get(`/api/ops/projects/${projectId}/outcomes`).then((x) => x.data), [projectId]);
  const [f, setF] = useState({ metric: planned[0]?.metric || "", unit: planned[0]?.unit || "", value: "", observedAt: "", event: "", note: "", followUpOf: "" });
  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      r.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const verified = (r.data?.records || []).filter((x) => x.verification.status === "verified" && x.level === "reported");
  return (
    <Panel title="Outcomes" description="Planned targets, reported figures, supervisor-verified figures and later follow-up observations are kept separate. Attendance is not counted as impact. Do not record names or other details that identify beneficiaries.">
      {r.status === "error" ? <ErrorState error={r.error} onRetry={r.reload} /> : null}
      <div className="overflow-x-auto">
        <table className="mb-4 w-full min-w-[560px] text-[13px]">
          <caption className="sr-only">Outcome summary</caption>
          <thead>
            <tr className="text-left text-muted">
              {["Metric", "Planned", "Reported", "Verified", "Partner-confirmed", "Follow-up"].map((h) => (
                <th key={h} scope="col" className="py-1 pr-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(r.data?.summary || []).map((s) => (
              <tr key={`${s.metric}|${s.unit}`} className="border-t border-line">
                <th scope="row" className="py-1 pr-2 text-left font-medium">
                  {s.metric} {s.unit ? <span className="text-muted">({s.unit})</span> : null}
                </th>
                <td className="tabular">{fmt(s.planned)}</td>
                <td className="tabular">{fmt(s.reported)}</td>
                <td className="tabular font-semibold">{fmt(s.verified)}</td>
                <td className="tabular">{fmt(s.partnerConfirmed)}</td>
                <td className="tabular">{fmt(s.followup)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mb-4 grid gap-2 text-[13px]">
        {(r.data?.records || []).map((o) => (
          <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <span>
              {o.level === "followup" ? "Follow-up: " : ""}
              <strong>
                {fmt(o.value)} {o.unit}
              </strong>{" "}
              {o.metric} · {formatDate(o.observedAt)} · by {o.reporterRole}
              {o.note ? ` · ${o.note}` : ""}
              {o.partnerConfirmation?.confirmed ? ` · confirmed by ${o.partnerConfirmation.partnerRole}` : ""}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={o.verification.status === "verified" ? "success" : o.verification.status === "rejected" ? "danger" : "warning"}>{o.verification.status}</Badge>
              {o.publication?.approved ? <Badge tone="info">Public</Badge> : null}
              {canVerify && o.verification.status === "pending" ? (
                <>
                  <Button size="sm" variant="dark" onClick={() => act(() => api.post(`/api/ops/outcomes/${o._id}/verify`, { decision: "verified" }), "Verified")}>
                    Verify
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { const reason = window.prompt("Reason for rejecting:"); if (reason) act(() => api.post(`/api/ops/outcomes/${o._id}/verify`, { decision: "rejected", reason }), "Rejected"); }}>
                    Reject
                  </Button>
                </>
              ) : null}
              {canVerify && o.verification.status === "verified" && !o.partnerConfirmation?.confirmed && o.level === "reported" ? (
                <Button size="sm" variant="ghost" onClick={() => { const role = window.prompt("Partner's role (e.g. Panchayat secretary):"); if (role) act(() => api.post(`/api/ops/outcomes/${o._id}/partner`, { partnerRole: role }), "Partner confirmation recorded"); }}>
                  Partner confirmed
                </Button>
              ) : null}
              {canVerify && o.verification.status === "verified" && o.level === "reported" ? (
                <Button size="sm" variant="ghost" onClick={() => act(() => api.post(`/api/ops/outcomes/${o._id}/publish`, { approved: !o.publication?.approved }), o.publication?.approved ? "Removed from public page" : "Published")}>
                  {o.publication?.approved ? "Unpublish" : "Publish"}
                </Button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input label="Metric" value={f.metric} onChange={(e) => setF({ ...f, metric: e.target.value })} list="planned-metrics" />
        <datalist id="planned-metrics">
          {planned.map((p) => (
            <option key={p.metric} value={p.metric} />
          ))}
        </datalist>
        <Input label="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
        <Input label="Value" type="number" min={0} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        <Input label="Observed on" type="date" value={f.observedAt} onChange={(e) => setF({ ...f, observedAt: e.target.value })} />
        <Select label="Session (optional)" value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })}>
          <option value="">—</option>
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>
              {formatDate(s.date)}
            </option>
          ))}
        </Select>
        {canVerify ? (
          <Select label="Follow-up of (optional)" value={f.followUpOf} onChange={(e) => setF({ ...f, followUpOf: e.target.value })}>
            <option value="">— new observation —</option>
            {verified.map((o) => (
              <option key={o._id} value={o._id}>
                {o.metric} {fmt(o.value)} ({formatDate(o.observedAt)})
              </option>
            ))}
          </Select>
        ) : null}
        <Textarea label="Note" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} containerClassName="sm:col-span-3" hint="No beneficiary names or contact details." />
        <Button
          variant="dark"
          disabled={!f.metric || f.value === ""}
          onClick={() => act(() => api.post(`/api/ops/projects/${projectId}/outcomes`, { ...f, value: Number(f.value), event: f.event || undefined, followUpOf: f.followUpOf || undefined, observedAt: f.observedAt || undefined }), "Outcome recorded — awaiting verification")}
        >
          Record outcome
        </Button>
      </div>
    </Panel>
  );
}
