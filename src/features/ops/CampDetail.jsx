"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import RowsEditor from "./RowsEditor";
import { CampStatus, rupees } from "./campShared";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "volunteers", label: "Volunteers" },
  { id: "plan", label: "Programme & logistics" },
  { id: "teams", label: "Teams" },
  { id: "safety", label: "Safety" },
  { id: "close", label: "Closing & completion" },
];
const DOC_TYPES = ["guardian_consent", "fitness_declaration", "institution_permission", "id_proof"];

function useAct(reload) {
  const [busy, setBusy] = useState(false);
  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const r = await fn();
      if (msg) toast.success(msg);
      reload();
      return r;
    } catch (e) {
      toast.error(errorMessage(e));
      return null;
    } finally {
      setBusy(false);
    }
  };
  return [busy, run];
}

function ReasonDialog({ open, title, onClose, onSubmit, extra }) {
  const [reason, setReason] = useState("");
  const [basis, setBasis] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<Button variant="dark" onClick={() => onSubmit(reason, basis)}>Confirm</Button>}>
      <div className="grid gap-3">
        <Textarea label="Reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        {extra ? <Input label="Policy basis" value={basis} onChange={(e) => setBasis(e.target.value)} /> : null}
      </div>
    </Modal>
  );
}

export default function CampDetail({ role = "coordinator" }) {
  const { campId } = useParams();
  const tabsId = useId();
  const [tab, setTab] = useState("overview");
  const r = useResource(() => api.get(`/api/ops/camps/${campId}`).then((x) => x.data), [campId]);
  const [busy, run] = useAct(r.reload);
  const [dialog, setDialog] = useState(null);
  const [contacts, setContacts] = useState(null);
  const incidents = useResource(() => api.get(`/api/ops/camps/${campId}/incidents`).then((x) => x.data.incidents), [campId], { enabled: tab === "safety" });
  const completion = useResource(() => api.get(`/api/ops/camps/${campId}/completion`).then((x) => x.data), [campId], { enabled: tab === "close" });
  const [inc, setInc] = useState({ occurredAt: "", category: "health", severity: "low", description: "", actionsTaken: "" });
  const [close, setClose] = useState({ summary: "", outcomes: "", issues: "" });

  if (r.status === "error") return <ErrorState error={r.error} onRetry={r.reload} />;
  if (!r.data) return <DashboardSkeleton />;
  const { camp, approvalChain, nextApproval } = r.data;
  const officer = role === "coordinator";
  const locked = ["completed", "reviewed", "rejected", "cancelled"].includes(camp.status);
  const post = (path, body, msg) => run(() => api.post(`/api/ops/camps/${campId}/${path}`, body), msg);
  const patch = (body) => run(() => api.patch(`/api/ops/camps/${campId}`, body), "Saved");
  const transition = (action, reason) => post("transition", { action, reason }, `Camp ${action === "approve" ? "approval recorded" : action}`);
  const docsOf = (sid) => camp.documents.filter((d) => String(d.student) === String(sid)).reduce((a, d) => ({ ...a, [d.type]: d.status }), {});
  const confirmed = camp.applications.filter((a) => a.status === "confirmed");

  const programmeRows = camp.programme.flatMap((d) => d.items.map((i) => ({ date: d.date, ...i })));
  const saveProgramme = (rows) => {
    const byDate = new Map();
    rows.forEach((x) => byDate.set(x.date, [...(byDate.get(x.date) || []), { time: x.time, activity: x.activity, lead: x.lead }]));
    patch({ programme: [...byDate].sort().map(([date, items]) => ({ date, items })) });
  };
  const totalBudget = camp.budget.reduce((s, b) => s + (b.estimatePaise || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Special camp"
        title={camp.title}
        description={`${formatDate(camp.startDate)} – ${formatDate(camp.endDate)} · ${camp.site?.community || "site not set"} · capacity ${camp.capacity}`}
        meta={<CampStatus status={camp.status} />}
        actions={
          camp.event ? (
            <Button variant="outline" href={`/${role === "coordinator" ? "coordinatorlayout" : "teacherLayout"}/camp/${camp.event}`}>
              Daily roll call & diary
            </Button>
          ) : null
        }
      />
      <Tabs id={tabsId} label="Camp sections" value={tab} onChange={setTab} tabs={TABS} className="mb-4" />
      <div {...tabPanelProps(tabsId, tab)}>
        {tab === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Approval" description={approvalChain.map((s) => s.name).join(" → ")}>
              <ol className="mb-3 grid gap-1 text-[13px]">
                {camp.approvals.map((a, i) => (
                  <li key={i}>
                    {a.step}: {a.decision} {formatDate(a.at)} {a.reason ? `— ${a.reason}` : ""}
                  </li>
                ))}
                {!camp.approvals.length ? <li className="text-muted">No approvals yet.</li> : null}
              </ol>
              <div className="flex flex-wrap gap-2">
                {officer && camp.status === "draft" ? <Button variant="dark" loading={busy} onClick={() => transition("submit")}>Submit for approval</Button> : null}
                {camp.status === "submitted" && !nextApproval?.done ? (
                  <>
                    <Button variant="dark" loading={busy} onClick={() => transition("approve")}>
                      Approve as {nextApproval.step?.name}
                    </Button>
                    <Button variant="outline" onClick={() => setDialog({ title: "Reject proposal", go: (reason) => transition("reject", reason) })}>
                      Reject
                    </Button>
                  </>
                ) : null}
                {officer && camp.status === "approved" ? <Button variant="dark" loading={busy} onClick={() => transition("start")}>Start camp</Button> : null}
                {officer && camp.status === "in_progress" ? <Button variant="dark" loading={busy} onClick={() => transition("complete")}>Mark completed</Button> : null}
                {officer && !["completed", "reviewed", "cancelled", "rejected"].includes(camp.status) ? (
                  <Button variant="danger-soft" onClick={() => setDialog({ title: "Cancel camp", go: (reason) => transition("cancel", reason) })}>
                    Cancel camp
                  </Button>
                ) : null}
              </div>
            </Panel>
            <Panel title="Site & purpose">
              <dl className="grid gap-1 text-[13px]">
                <div><dt className="inline font-semibold">Host: </dt><dd className="inline">{camp.site?.hostOrganisation || "—"}</dd></div>
                <div><dt className="inline font-semibold">Address: </dt><dd className="inline">{camp.site?.address || "—"}</dd></div>
                <div><dt className="inline font-semibold">Needs: </dt><dd className="inline">{camp.site?.needs || "—"}</dd></div>
                <div><dt className="inline font-semibold">Objectives: </dt><dd className="inline">{camp.objectives || "—"}</dd></div>
                <div><dt className="inline font-semibold">Supervisors: </dt><dd className="inline">{camp.supervisors.map((s) => s.name).join(", ") || "—"}</dd></div>
                <div><dt className="inline font-semibold">Budget estimate: </dt><dd className="inline">{rupees(totalBudget)} (expenses are recorded under Finance)</dd></div>
              </dl>
            </Panel>
          </div>
        ) : null}

        {tab === "volunteers" ? (
          <Panel title="Applications" description={`Required documents: ${[...new Set([...camp.requiredDocuments, ...(camp.guardianPermissionRequired ? ["guardian_consent"] : [])])].join(", ") || "none"} (Class XI/XII always need guardian consent). Only status is recorded; documents are seen physically.`} padded={false}>
            <ul>
              {camp.applications.map((a) => {
                const docs = docsOf(a.student?._id);
                return (
                  <li key={a.student?._id} className="border-b border-line px-5 py-3 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-fg">
                        {a.student?.name} <span className="text-[13px] font-normal text-muted">· {a.status}</span>
                      </p>
                      {officer && !locked ? (
                        <div className="flex flex-wrap gap-2">
                          {["select", "confirm", "waitlist", "decline", "withdraw"].map((x) => (
                            <Button key={x} size="sm" variant="outline" disabled={busy} onClick={() => post("applications", { student: a.student._id, action: x }, "Updated")}>
                              {x}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[12.5px]">
                      {DOC_TYPES.map((t) => (
                        <label key={t} className="flex items-center gap-1">
                          {t.replace(/_/g, " ")}:
                          <select className="h-8 rounded-md border border-line px-1" value={docs[t] || ""} disabled={locked} onChange={(e) => post("documents", { student: a.student._id, type: t, status: e.target.value }, "Document status recorded")}>
                            <option value="" disabled>
                              —
                            </option>
                            {["pending", "received", "verified", "rejected"].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </li>
                );
              })}
              {!camp.applications.length ? <li className="px-5 py-4 text-[13px] text-muted">No applications yet. Volunteers apply once the camp is approved.</li> : null}
            </ul>
          </Panel>
        ) : null}

        {tab === "plan" ? (
          <div className="grid gap-4">
            <Panel title="Daily programme">
              <RowsEditor caption="Daily programme" disabled={locked} saving={busy} rows={programmeRows} fields={[{ key: "date", label: "Date", type: "date" }, { key: "time", label: "Time", type: "time" }, { key: "activity", label: "Activity" }, { key: "lead", label: "Lead" }]} onSave={saveProgramme} />
            </Panel>
            <Panel title="Meals">
              <RowsEditor caption="Meals" disabled={locked} saving={busy} rows={camp.meals} fields={[{ key: "date", label: "Date", type: "date" }, { key: "meal", label: "Meal", options: ["breakfast", "lunch", "snacks", "dinner"] }, { key: "headcount", label: "Headcount", type: "number" }, { key: "notes", label: "Notes" }]} onSave={(meals) => patch({ meals })} />
            </Panel>
            <Panel title="Transport">
              <RowsEditor caption="Transport" disabled={locked} saving={busy} rows={camp.transport} fields={[{ key: "date", label: "Date", type: "date" }, { key: "mode", label: "Mode" }, { key: "from", label: "From" }, { key: "to", label: "To" }, { key: "notes", label: "Notes" }]} onSave={(transport) => patch({ transport })} />
            </Panel>
            <Panel title="Materials">
              <RowsEditor caption="Materials" disabled={locked} saving={busy} rows={camp.materials} fields={[{ key: "item", label: "Item" }, { key: "quantity", label: "Qty", type: "number" }, { key: "unit", label: "Unit" }, { key: "status", label: "Status", options: ["needed", "arranged", "received", "returned"] }]} onSave={(materials) => patch({ materials })} />
            </Panel>
            <Panel title="Budget estimate (₹)" description="Estimates only. Actual expenses, vouchers and reconciliation are under Finance.">
              <RowsEditor
                caption="Budget"
                disabled={locked}
                saving={busy}
                rows={camp.budget.map((b) => ({ head: b.head, rupees: String((b.estimatePaise || 0) / 100) }))}
                fields={[{ key: "head", label: "Head" }, { key: "rupees", label: "Estimate (₹)", type: "number" }]}
                onSave={(rows) => patch({ budget: rows.map((x) => ({ head: x.head, estimatePaise: Math.round(Number(x.rupees || 0) * 100) })) })}
              />
            </Panel>
          </div>
        ) : null}

        {tab === "teams" ? (
          <Panel title="Teams & duties" description="Members must be confirmed volunteers; enter their names exactly as listed.">
            <RowsEditor
              caption="Teams"
              disabled={locked}
              saving={busy}
              rows={camp.teams.map((t) => ({ name: t.name, duties: t.duties, supervisor: camp.supervisors.find((s) => String(s._id) === String(t.supervisor))?.name || "", members: t.members.map((m) => confirmed.find((c) => String(c.student._id) === String(m))?.student.name).filter(Boolean).join(", ") }))}
              fields={[{ key: "name", label: "Team" }, { key: "duties", label: "Duties" }, { key: "supervisor", label: "Supervisor", options: ["", ...camp.supervisors.map((s) => s.name)] }, { key: "members", label: "Members (comma-separated)" }]}
              onSave={(rows) =>
                patch({
                  teams: rows.map((t) => ({
                    name: t.name,
                    duties: t.duties,
                    supervisor: camp.supervisors.find((s) => s.name === t.supervisor)?._id,
                    members: String(t.members || "")
                      .split(",")
                      .map((n) => n.trim())
                      .filter(Boolean)
                      .map((n) => confirmed.find((c) => c.student.name === n)?.student._id || n),
                  })),
                })
              }
            />
          </Panel>
        ) : null}

        {tab === "safety" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Emergency contacts" description="Restricted. Viewing is logged.">
              {contacts ? (
                <ul className="grid gap-1 text-[13px]">
                  {contacts.map((c, i) => (
                    <li key={i}>
                      {c.student?.name}: {c.name} ({c.relation}) {c.phone}
                    </li>
                  ))}
                  {!contacts.length ? <li className="text-muted">No contacts recorded.</li> : null}
                </ul>
              ) : (
                <Button variant="outline" icon={Lock} onClick={() => run(async () => setContacts((await api.get(`/api/ops/camps/${campId}/emergency-contacts`)).data.contacts))}>
                  Show contacts
                </Button>
              )}
            </Panel>
            <Panel title="Incidents" description="Restricted to Programme Officers and this camp's supervisors.">
              <ul className="mb-4 grid gap-2 text-[13px]">
                {(incidents.data || []).map((x) => (
                  <li key={x._id} className="rounded-lg border border-line p-2">
                    <p className="font-semibold">
                      {formatDate(x.occurredAt)} · {x.category} · {x.severity} · {x.status}
                    </p>
                    <p className="whitespace-pre-wrap">{x.description}</p>
                    {x.actionsTaken ? <p>Action: {x.actionsTaken}</p> : null}
                    {x.status === "open" ? (
                      <Button size="sm" variant="ghost" onClick={() => setDialog({ title: "Close incident", go: (reason) => run(() => api.patch(`/api/ops/incidents/${x._id}`, { status: "closed", note: reason }), "Incident closed").then(incidents.reload) })}>
                        Close
                      </Button>
                    ) : null}
                  </li>
                ))}
                {incidents.data && !incidents.data.length ? <li className="text-muted">No incidents reported.</li> : null}
              </ul>
              <div className="grid gap-2 sm:grid-cols-3">
                <Input label="When" type="datetime-local" value={inc.occurredAt} onChange={(e) => setInc({ ...inc, occurredAt: e.target.value })} />
                <Select label="Category" value={inc.category} onChange={(e) => setInc({ ...inc, category: e.target.value })}>
                  {["health", "injury", "safety", "conduct", "property", "other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Select label="Severity" value={inc.severity} onChange={(e) => setInc({ ...inc, severity: e.target.value })}>
                  {["low", "medium", "high"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Textarea label="What happened" rows={2} value={inc.description} onChange={(e) => setInc({ ...inc, description: e.target.value })} containerClassName="sm:col-span-3" />
                <Textarea label="Action taken" rows={2} value={inc.actionsTaken} onChange={(e) => setInc({ ...inc, actionsTaken: e.target.value })} containerClassName="sm:col-span-3" />
                <Button variant="dark" onClick={() => post("incidents", inc, "Incident recorded").then(incidents.reload)} disabled={!inc.occurredAt || !inc.description}>
                  Record incident
                </Button>
              </div>
            </Panel>
          </div>
        ) : null}

        {tab === "close" ? (
          <div className="grid gap-4">
            <Panel title="Completion review" description={completion.data ? `Required ${completion.data.requiredDays} verified camp days${completion.data.policy ? ` (${completion.data.policy.name} v${completion.data.policy.version})` : " (no active policy: camp length used)"}.` : ""}>
              {completion.status === "error" ? <ErrorState error={completion.error} onRetry={completion.reload} /> : null}
              <ul className="grid gap-2 text-[13px]">
                {(completion.data?.rows || []).map((x) => (
                  <li key={x.student} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                    <span>
                      <strong>{x.name}</strong>: {x.daysCredited} days credited{x.missingDays.length ? ` · missing ${x.missingDays.join(", ")}` : " · no missing days"}
                      {x.decision ? ` · decision: ${x.decision.decision}${x.decision.basis ? ` (basis: ${x.decision.basis})` : ""}` : ""}
                    </span>
                    {officer && ["completed", "reviewed"].includes(camp.status) ? (
                      <span className="flex gap-2">
                        <Button size="sm" variant="dark" disabled={!x.meetsRequirement} onClick={() => post("completion", { student: x.student, decision: "complete" }, "Recorded").then(completion.reload)}>
                          Complete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDialog({ title: "Mark incomplete", go: (reason) => post("completion", { student: x.student, decision: "incomplete", reason }, "Recorded").then(completion.reload) })}>
                          Incomplete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDialog({ title: "Record an exception", extra: true, go: (reason, basis) => post("completion", { student: x.student, decision: "exception", reason, basis }, "Exception recorded").then(completion.reload) })}>
                          Exception
                        </Button>
                      </span>
                    ) : null}
                  </li>
                ))}
                {completion.data && !completion.data.rows.length ? <li className="text-muted">No confirmed volunteers.</li> : null}
              </ul>
            </Panel>
            <Panel title="Closing report">
              {camp.closingReport?.submittedAt ? (
                <div className="grid gap-1 text-[13px]">
                  <p className="whitespace-pre-wrap">{camp.closingReport.summary}</p>
                  {camp.closingReport.outcomes ? <p>Outcomes: {camp.closingReport.outcomes}</p> : null}
                  {camp.closingReport.issues ? <p>Issues: {camp.closingReport.issues}</p> : null}
                  <p className="text-muted">Submitted {formatDate(camp.closingReport.submittedAt)}{camp.closingReport.reviewedAt ? ` · reviewed ${formatDate(camp.closingReport.reviewedAt)}` : ""}</p>
                  {officer && camp.status === "completed" ? <Button variant="dark" className="mt-2 w-fit" onClick={() => post("closing-report", { action: "review" }, "Camp reviewed")}>Mark reviewed</Button> : null}
                </div>
              ) : camp.status === "completed" ? (
                <div className="grid gap-2">
                  <Textarea label="Summary" rows={3} value={close.summary} onChange={(e) => setClose({ ...close, summary: e.target.value })} />
                  <Textarea label="Outcomes (supervisor-observed)" rows={2} value={close.outcomes} onChange={(e) => setClose({ ...close, outcomes: e.target.value })} />
                  <Textarea label="Issues and follow-up" rows={2} value={close.issues} onChange={(e) => setClose({ ...close, issues: e.target.value })} />
                  <Button variant="dark" className="w-fit" onClick={() => post("closing-report", close, "Closing report submitted")}>
                    Submit closing report
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-muted">Available once the camp is marked completed.</p>
              )}
            </Panel>
          </div>
        ) : null}
      </div>
      <ReasonDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        extra={dialog?.extra}
        onClose={() => setDialog(null)}
        onSubmit={(reason, basis) => {
          dialog.go(reason, basis);
          setDialog(null);
        }}
      />
      <p className="mt-6 text-[13px] text-muted">
        <Link className="underline" href={role === "coordinator" ? "/coordinatorlayout/camps" : "/teacherLayout/camps"}>
          All camps
        </Link>
      </p>
    </>
  );
}
