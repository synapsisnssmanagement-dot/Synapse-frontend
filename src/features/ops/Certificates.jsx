"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Award, FileText, RotateCcw, ShieldX } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { REQUIREMENT_LABEL, StateBadge, hours, openPdf } from "./shared";

function Prepare({ open, onClose, onDone }) {
  const vols = useResource(() => getList("/api/coordinator/volunteers", "volunteers"), []);
  const pols = useResource(() => api.get("/api/ops/policies").then((r) => r.data.policies.filter((p) => p.status === "active")), []);
  const [student, setStudent] = useState("");
  const [policy, setPolicy] = useState("");
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState("");
  const [basis, setBasis] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const check = async () => {
    setError("");
    setPreview(null);
    try {
      setPreview((await api.get("/api/ops/certificates/preview", { params: { student, policy } })).data);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const prepare = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/ops/certificates", { student, policy, exception: preview?.evaluation?.met ? undefined : { reason, basis } });
      toast.success("Prepared. Another Programme Officer reviews it before it is issued.");
      onDone();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const ev = preview?.evaluation;
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Prepare a completion certificate"
      description="Built from verified ledger service only. The evaluation is frozen into the certificate."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={check} disabled={!student || !policy}>
            Check requirements
          </Button>
          <Button variant="dark" onClick={prepare} loading={busy} disabled={!preview}>
            Prepare for review
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="Volunteer" value={student} onChange={(e) => { setStudent(e.target.value); setPreview(null); }} placeholder="Choose volunteer">
          {(vols.data || []).map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Select label="Policy" value={policy} onChange={(e) => { setPolicy(e.target.value); setPreview(null); }} placeholder="Choose active policy">
          {(pols.data || []).map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} v{p.version} — {REQUIREMENT_LABEL[p.requirementType]}
            </option>
          ))}
        </Select>
        {ev ? (
          <div className="rounded-lg border border-line bg-canvas p-3 text-[13px]" role="status">
            <p className="font-semibold">{ev.met ? "All requirements met." : "Requirements NOT met."}</p>
            <p>
              Qualifying years: {ev.qualifyingYears.length}/{ev.yearsRequired}
              {ev.consecutiveYears ? " (consecutive)" : ""} · {ev.years.map((y) => `${y.label}: ${hours(y.minutes)} h`).join(", ") || "no verified regular service"}
            </p>
            {ev.camp.required ? <p>Camp: {ev.camp.met ? "complete" : `not complete (best ${Math.max(0, ...ev.camp.camps.map((c) => c.daysAttended))}/${ev.camp.requiredDays} days)`}</p> : null}
          </div>
        ) : null}
        {ev && !ev.met ? (
          <>
            <Textarea label="Exception reason (required)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            <Input label="Policy basis for the exception (required)" value={basis} onChange={(e) => setBasis(e.target.value)} hint="Cite the rule or decision that allows it." />
          </>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13px] font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function ReasonAction({ action, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!action) return null;
  const labels = { reject: "Reject", revoke: "Revoke", reissue: "Reissue" };
  const go = async () => {
    setBusy(true);
    try {
      const path = action.kind === "reject" ? "review" : action.kind;
      await api.post(`/api/ops/certificates/${action.cert._id}/${path}`, { action: action.kind === "reject" ? "reject" : undefined, reason });
      toast.success(`${labels[action.kind]} recorded`);
      setReason("");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={`${labels[action.kind]} ${action.cert.certId}`}
      description={action.kind === "revoke" ? "The record is kept and public verification will show it as revoked." : action.kind === "reissue" ? "A new certificate is prepared with a fresh evaluation; this one is marked superseded." : ""}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={action.kind === "reissue" ? "dark" : "danger"} onClick={go} loading={busy}>
            {labels[action.kind]}
          </Button>
        </>
      }
    >
      <Textarea label="Reason (required)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
}

export default function Certificates() {
  const list = useResource(() => api.get("/api/ops/certificates").then((r) => r.data.certificates), []);
  const [prep, setPrep] = useState(false);
  const [action, setAction] = useState(null);
  const issue = async (c) => {
    try {
      await api.post(`/api/ops/certificates/${c._id}/review`, { action: "issue" });
      toast.success("Issued");
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Recognition"
        title="Completion certificates"
        description="NSS / institutional completion certificates, separate from event participation certificates. A second Programme Officer reviews each one before issue. PDFs carry signature placeholders and are not digitally signed."
        actions={<Button variant="dark" icon={Award} onClick={() => setPrep(true)}>Prepare certificate</Button>}
      />
      {list.status === "error" ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <TableSkeleton />
      ) : list.data.length ? (
        <Panel padded={false}>
          <ul>
            {list.data.map((c) => (
              <li key={c._id} className="flex flex-col gap-2 border-b border-line px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-fg">
                    {c.studentName} — <span className="font-mono text-[13px]">{c.certId}</span>
                  </p>
                  <p className="text-[13px] text-muted">
                    {c.policyName} v{c.policyVersion} · {REQUIREMENT_LABEL[c.requirementType]}
                    {c.issuedAt ? ` · issued ${formatDate(c.issuedAt)}` : ""}
                    {c.exception?.granted ? " · exception recorded" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StateBadge state={c.status} />
                  <Button size="sm" variant="ghost" icon={FileText} onClick={() => openPdf(api, `/api/ops/certificates/${c._id}/pdf`).catch((e) => toast.error(errorMessage(e)))}>
                    PDF
                  </Button>
                  {c.status === "pending_review" ? (
                    <>
                      <Button size="sm" variant="dark" onClick={() => issue(c)}>
                        Issue
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAction({ kind: "reject", cert: c })}>
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {c.status === "issued" ? (
                    <Button size="sm" variant="danger-soft" icon={ShieldX} onClick={() => setAction({ kind: "revoke", cert: c })}>
                      Revoke
                    </Button>
                  ) : null}
                  {["issued", "revoked"].includes(c.status) ? (
                    <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => setAction({ kind: "reissue", cert: c })}>
                      Reissue
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState icon={Award} title="No completion certificates yet" description="Prepare one when a volunteer's verified service meets an active policy." />
      )}
      <Prepare open={prep} onClose={() => setPrep(false)} onDone={list.reload} />
      <ReasonAction action={action} onClose={() => setAction(null)} onDone={list.reload} />
    </>
  );
}
