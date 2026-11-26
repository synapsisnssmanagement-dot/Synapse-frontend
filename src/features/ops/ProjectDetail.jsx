"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import Outcomes from "./Outcomes";
import RowsEditor from "./RowsEditor";
import { CampStatus, rupees } from "./campShared";

const STAGES = ["draft", "submitted", "approved", "scheduled", "in_progress", "completed", "reviewed", "archived"];
const LABEL = { draft: "Draft", submitted: "Submitted", approved: "Approved", scheduled: "Scheduled", in_progress: "In progress", completed: "Completed", reviewed: "Reviewed", archived: "Archived", rejected: "Rejected", cancelled: "Cancelled" };
const NEXT_HINT = {
  draft: "Next: submit the project for approval.",
  submitted: "Waiting for approval.",
  approved: "Next: mark required permissions as obtained, then schedule sessions.",
  scheduled: "Sessions are scheduled. Start the project when work begins.",
  in_progress: "In progress. Take attendance at each session; mark completed when done.",
  completed: "Next: review the project with a short summary.",
  reviewed: "Reviewed. Archive it when nothing is left to follow up.",
  archived: "Archived.",
  rejected: "Rejected.",
  cancelled: "Cancelled.",
};

function Stepper({ status }) {
  const stopped = ["rejected", "cancelled"].includes(status);
  const idx = STAGES.indexOf(status);
  return (
    <div>
      {stopped ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">This project was {status}.</p> : null}
      <ol className="flex flex-wrap gap-y-3" aria-label="Project stage">
        {STAGES.map((st, i) => {
          const done = !stopped && i < idx;
          const current = !stopped && i === idx;
          return (
            <li key={st} className="flex min-w-0 flex-1 basis-[11%] items-center" aria-current={current ? "step" : undefined}>
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <span className={cx("flex size-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold", done ? "border-brand bg-brand text-ink" : current ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper text-subtle")}>
                  {done ? <Check aria-hidden="true" className="size-3.5" /> : i + 1}
                </span>
                <span className={cx("text-[11.5px] leading-tight", current ? "font-semibold text-fg" : done ? "text-fg-2" : "text-subtle")}>{LABEL[st]}</span>
              </div>
              {i < STAGES.length - 1 ? <span className={cx("mx-1 mb-5 h-0.5 flex-1", done ? "bg-brand" : "bg-line")} aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function GoalsEditor({ goals, editable, busy, onSave }) {
  const [v, setV] = useState(goals || "");
  const [seen, setSeen] = useState(goals);
  if (seen !== goals) {
    setSeen(goals);
    setV(goals || "");
  }
  if (!editable) return <p className="text-[13px] text-fg-2"><span className="font-semibold text-fg">Goals: </span>{goals || "Not recorded."} <span className="text-muted">(locked after approval)</span></p>;
  return (
    <div className="grid gap-2">
      <Textarea label="Goals and intended outcomes" rows={2} value={v} onChange={(e) => setV(e.target.value)} />
      <Button size="sm" variant="dark" className="w-fit" loading={busy} disabled={v === (goals || "")} onClick={() => onSave(v)}>
        Save goals
      </Button>
    </div>
  );
}

function Pick({ title, items, selected, onToggle, empty }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-fg">
        {title} <span className="font-normal text-muted">({selected.length} selected)</span>
      </legend>
      {items === null ? (
        <p className="text-[12.5px] text-muted">Loading…</p>
      ) : items.length ? (
        <div className="flex max-h-44 flex-wrap gap-1.5 overflow-auto">
          {items.map((x) => {
            const on = selected.includes(x._id);
            return (
              <button key={x._id} type="button" aria-pressed={on} onClick={() => onToggle(x._id)} className={cx("rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors", on ? "border-brand bg-mint text-brand-700" : "border-line bg-paper text-fg-2 hover:border-line-strong")}>
                {on ? <Check aria-hidden="true" className="mr-1 inline size-3" /> : null}
                {x.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted">{empty}</p>
      )}
    </fieldset>
  );
}

function TeamPanel({ project, editable, onSave, busy }) {
  const people = useResource(() => (editable ? api.get("/api/ops/officers").then((r) => r.data.teachers) : Promise.resolve([])), [editable]);
  const vols = useResource(() => (editable ? getList("/api/coordinator/volunteers", "volunteers") : Promise.resolve([])), [editable]);
  const staffIds = project.responsibleStaff.map((s) => s._id || s);
  const memberIds = project.volunteerTeams.flatMap((t) => t.members.map((m) => m._id || m));
  const [staff, setStaff] = useState(null);
  const [members, setMembers] = useState(null);
  const curStaff = staff || staffIds;
  const curMembers = members || memberIds;
  const toggle = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const dirty = Boolean(staff || members);
  if (!editable) {
    return (
      <Panel title="Staff and volunteer team">
        <p className="text-[13px] text-fg-2"><span className="font-semibold text-fg">Responsible staff: </span>{project.responsibleStaff.map((s) => s.name).join(", ") || "none"}</p>
        <p className="mt-1 text-[13px] text-fg-2"><span className="font-semibold text-fg">Volunteers: </span>{project.volunteerTeams.flatMap((t) => t.members.map((m) => m.name)).join(", ") || "none"}</p>
      </Panel>
    );
  }
  return (
    <Panel title="Staff and volunteer team" description="Supervisors take attendance and review diaries; the team becomes each session's participants.">
      <div className="grid gap-4">
        <Pick title="Responsible staff (teachers)" items={people.data ?? null} selected={curStaff} onToggle={(id) => toggle(curStaff, setStaff, id)} empty="No active teachers in your institution." />
        <Pick title="Volunteer team" items={vols.data ?? null} selected={curMembers} onToggle={(id) => toggle(curMembers, setMembers, id)} empty="No volunteers yet. Promote students under People → Students." />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="dark"
            loading={busy}
            disabled={!dirty}
            onClick={async () => {
              await onSave({ responsibleStaff: curStaff, volunteerTeams: [{ name: project.volunteerTeams[0]?.name || "Team", members: curMembers }] });
              setStaff(null);
              setMembers(null);
            }}
          >
            Save team
          </Button>
          {dirty ? (
            <Button size="sm" variant="ghost" onClick={() => { setStaff(null); setMembers(null); }}>
              Discard
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

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
  const locked = ["completed", "reviewed", "archived", "cancelled", "rejected"].includes(p.status);
  return (
    <>
      <PageHeader eyebrow={p.kind.replace("_", "-")} title={p.title} description={`${p.community?.name || "No community set"}${p.community?.adopted ? " (adopted)" : ""} · ${p.partner?.organisation || "no partner"} · budget estimate ${rupees(p.budgetEstimatePaise)}`} meta={<CampStatus status={p.status} />} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Lifecycle" className="lg:col-span-2">
          <Stepper status={p.status} />
          <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-fg">{NEXT_HINT[p.status] || "No further steps."}</p>
              <p className="mt-0.5 text-[12.5px] text-muted">Approval chain: {approvalChain.map((s) => s.name).join(" → ")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {next ? <Button variant="dark" loading={busy} onClick={() => t(next[0])}>{next[1]}</Button> : null}
                {p.status === "submitted" && !nextApproval?.done ? (
                  <>
                    <Button variant="dark" loading={busy} onClick={() => t("approve")}>Approve as {nextApproval.step?.name}</Button>
                    <Button variant="outline" onClick={() => ask("Reject project", (reason) => t("reject", { reason }))}>Reject</Button>
                  </>
                ) : null}
                {officer && p.status === "completed" ? <Button variant="dark" onClick={() => ask("Review summary", (summary) => t("review", { summary }))}>Review</Button> : null}
                {officer && !["reviewed", "archived", "rejected", "cancelled"].includes(p.status) ? <Button variant="danger-soft" onClick={() => ask("Cancel project", (reason) => t("cancel", { reason }))}>Cancel project</Button> : null}
              </div>
            </div>
            <ol className="grid gap-2 text-[12.5px] lg:max-w-md lg:shrink-0" aria-label="History">
              {p.transitions.slice().reverse().map((x, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-fg">{LABEL[x.to] || x.to}</span>
                    <span className="text-muted"> · {formatDate(x.at)}</span>
                    {x.reason && x.reason !== "Created" ? <span className="text-fg-2"> — {x.reason}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Panel>

        <TeamPanel project={p} editable={officer && !locked} onSave={(body) => run(() => api.patch(`/api/ops/projects/${projectId}`, body), "Team saved")} busy={busy} />

        <Panel title="Needs, baseline and goals" description="What the community needs, where things stand now, and what this project aims to change.">
          {p.communityRequest ? (
            <p className="mb-3 rounded-lg bg-canvas p-3 text-[12.5px] text-fg-2">
              From a community request by <strong>{p.communityRequest.orgName}</strong> ({formatDate(p.communityRequest.createdAt)}): “{p.communityRequest.description}”
            </p>
          ) : null}
          <RowsEditor
            caption="Needs"
            saving={busy}
            disabled={locked}
            addLabel="Add need"
            rows={p.needs.map((n) => ({ need: n.need, baseline: n.baseline, source: n.source }))}
            fields={[{ key: "need", label: "Need" }, { key: "baseline", label: "Baseline (now)" }, { key: "source", label: "Source" }]}
            onSave={(needs) => run(() => api.patch(`/api/ops/projects/${projectId}`, { needs }), "Needs saved")}
          />
          <div className="mt-4 border-t border-line pt-4">
            <GoalsEditor goals={p.goals} editable={["draft", "submitted"].includes(p.status)} busy={busy} onSave={(goals) => run(() => api.patch(`/api/ops/projects/${projectId}`, { goals }), "Goals saved")} />
          </div>
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
