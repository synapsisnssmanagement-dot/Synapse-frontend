"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import Outcomes from "./Outcomes";
import RowsEditor from "./RowsEditor";
import { CampStatus, rupees } from "./campShared";

export default function ProjectDetail({ role = "coordinator" }) {
  const { projectId } = useParams();
  const r = useResource(() => api.get(`/api/ops/projects/${projectId}`).then((x) => x.data), [projectId]);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [text, setText] = useState("");
  const [task, setTask] = useState({ task: "", due: "" });
  const [sessionDate, setSessionDate] = useState("");
  if (r.status === "error") return <ErrorState error={r.error} onRetry={r.reload} />;
  if (!r.data) return <DashboardSkeleton />;
  const { project: p, sessions, approvalChain, nextApproval } = r.data;
  const officer = role === "coordinator";
  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const x = await fn();
      if (msg) toast.success(msg);
      r.reload();
      return x;
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const t = (action, extra = {}) => run(() => api.post(`/api/ops/projects/${projectId}/transition`, { action, ...extra }), `Project: ${action}`);
  const ask = (title, go) => {
    setText("");
    setDialog({ title, go });
  };
  const prefix = role === "coordinator" ? "/coordinatorlayout" : "/teacherLayout";
  const NEXT = { draft: officer && ["submit", "Submit for approval"], approved: officer && ["schedule", "Schedule sessions"], scheduled: ["start", "Start"], in_progress: ["complete", "Mark completed"], reviewed: officer && ["archive", "Archive"] };
  const next = NEXT[p.status];
  return (
    <>
      <PageHeader eyebrow={p.kind.replace("_", "-")} title={p.title} description={`${p.community?.name || "No community set"}${p.community?.adopted ? " (adopted)" : ""} · ${p.partner?.organisation || "no partner"} · budget estimate ${rupees(p.budgetEstimatePaise)}`} meta={<CampStatus status={p.status} />} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Lifecycle" description="Draft → Submitted → Approved → Scheduled → In progress → Completed → Reviewed → Archived">
          <ol className="mb-3 grid gap-1 text-[13px]">
            {p.transitions.map((x, i) => (
              <li key={i}>
                {formatDate(x.at)} · {x.from || "—"} → {x.to}
                {x.reason ? ` — ${x.reason}` : ""}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {next ? <Button variant="dark" loading={busy} onClick={() => t(next[0])}>{next[1]}</Button> : null}
            {p.status === "submitted" && !nextApproval?.done ? (
              <>
                <Button variant="dark" loading={busy} onClick={() => t("approve")}>Approve as {nextApproval.step?.name}</Button>
                <Button variant="outline" onClick={() => ask("Reject project", (reason) => t("reject", { reason }))}>Reject</Button>
              </>
            ) : null}
            {officer && p.status === "completed" ? <Button variant="dark" onClick={() => ask("Review summary", (summary) => t("review", { summary }))}>Review</Button> : null}
            {officer && !["reviewed", "archived", "rejected", "cancelled"].includes(p.status) ? <Button variant="danger-soft" onClick={() => ask("Cancel project", (reason) => t("cancel", { reason }))}>Cancel</Button> : null}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">Approval chain: {approvalChain.map((s) => s.name).join(" → ")}</p>
        </Panel>
        <Panel title="Needs, baseline and goals">
          <ul className="grid gap-1 text-[13px]">
            {p.needs.map((n, i) => (
              <li key={i}>
                <strong>{n.need}</strong>
                {n.baseline ? ` — baseline: ${n.baseline}` : ""}
                {n.source ? ` (${n.source})` : ""}
              </li>
            ))}
            {!p.needs.length ? <li className="text-muted">No needs recorded.</li> : null}
          </ul>
          {p.goals ? <p className="mt-2 text-[13px]">Goals: {p.goals}</p> : null}
          {p.communityRequest ? (
            <p className="mt-2 text-[13px] text-muted">
              From community request by {p.communityRequest.orgName} ({formatDate(p.communityRequest.createdAt)}): “{p.communityRequest.description}”
            </p>
          ) : null}
        </Panel>
        <Panel title="Required permissions" description="Scheduling is blocked while any permission is pending.">
          <RowsEditor
            caption="Permissions"
            saving={busy}
            disabled={["completed", "reviewed", "archived", "cancelled", "rejected"].includes(p.status)}
            rows={p.requiredPermissions.map((x) => ({ name: x.name, status: x.status, reference: x.reference }))}
            fields={[{ key: "name", label: "Permission" }, { key: "status", label: "Status", options: ["pending", "obtained", "not_required"] }, { key: "reference", label: "Reference" }]}
            onSave={(rows) => run(() => api.patch(`/api/ops/projects/${projectId}`, { requiredPermissions: rows }), "Permissions saved")}
          />
        </Panel>
        <Panel title="Documents & evidence" description="https links only (e.g. your institution's document storage).">
          <RowsEditor
            caption="Documents"
            saving={busy}
            disabled={["archived", "cancelled", "rejected"].includes(p.status)}
            rows={p.documents.map((d) => ({ label: d.label, url: d.url }))}
            fields={[{ key: "label", label: "Label" }, { key: "url", label: "Link (https)" }]}
            onSave={(rows) => run(() => api.patch(`/api/ops/projects/${projectId}`, { documents: rows }), "Documents saved")}
          />
        </Panel>
        <Panel title="Sessions" description={`${p.schedule?.recurrence?.freq !== "none" ? `Repeats ${p.schedule.recurrence.freq}` : "Single session"} · ${p.schedule?.sessionHours || 0} h each`}>
          <ul className="mb-3 grid gap-1 text-[13px]">
            {sessions.map((s) => (
              <li key={s._id}>
                <Link className="underline" href={`${prefix}/fieldattendance`}>
                  {formatDate(s.date)}
                </Link>{" "}
                · {s.status}
              </li>
            ))}
            {!sessions.length ? <li className="text-muted">Sessions are created when the project is scheduled.</li> : null}
          </ul>
          {["scheduled", "in_progress"].includes(p.status) ? (
            <div className="flex items-end gap-2">
              <Input label="Add a session" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              <Button variant="outline" disabled={!sessionDate} onClick={() => run(() => api.post(`/api/ops/projects/${projectId}/sessions`, { date: sessionDate }), "Session added")}>
                Add
              </Button>
            </div>
          ) : null}
        </Panel>
        <Panel title="Follow-up tasks">
          <ul className="mb-3 grid gap-1 text-[13px]">
            {p.followUps.map((f) => (
              <li key={f._id} className="flex items-center justify-between gap-2">
                <span className={f.status === "done" ? "line-through text-muted" : ""}>
                  {f.task}
                  {f.due ? ` · due ${formatDate(f.due)}` : ""}
                </span>
                {f.status === "open" ? (
                  <Button size="sm" variant="ghost" onClick={() => run(() => api.post(`/api/ops/projects/${projectId}/follow-ups`, { followUpId: f._id }), "Done")}>
                    Mark done
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Input label="Task" value={task.task} onChange={(e) => setTask({ ...task, task: e.target.value })} />
            <Input label="Due" type="date" value={task.due} onChange={(e) => setTask({ ...task, due: e.target.value })} />
            <Button variant="outline" disabled={!task.task} onClick={() => run(() => api.post(`/api/ops/projects/${projectId}/follow-ups`, task), "Added").then(() => setTask({ task: "", due: "" }))}>
              Add
            </Button>
          </div>
        </Panel>
      </div>
      <div className="mt-4">
        <Outcomes projectId={projectId} planned={p.plannedOutcomes} sessions={sessions} canVerify={role === "coordinator" || role === "teacher"} />
      </div>
      <Modal open={Boolean(dialog)} onClose={() => setDialog(null)} title={dialog?.title} footer={<Button variant="dark" onClick={() => { dialog.go(text); setDialog(null); }}>Confirm</Button>}>
        <Textarea label="Reason / summary" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </Modal>
    </>
  );
}
