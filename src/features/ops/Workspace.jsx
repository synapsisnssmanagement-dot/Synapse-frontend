"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { ClipboardCheck, CornerUpLeft, MessageSquareWarning, TriangleAlert, UserX } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { GRIEVANCE_LABEL, formatMinutes, hours } from "./shared";

function List({ items, empty, render }) {
  if (!items?.length) return <p className="text-[13px] text-muted">{empty}</p>;
  return <ul className="grid gap-2">{items.map(render)}</ul>;
}
const Item = ({ href, title, meta }) => (
  <li>
    <Link href={href} className="block rounded-lg border border-line px-3 py-2 hover:border-fg focus-visible:outline-2">
      <span className="block font-medium text-fg">{title}</span>
      {meta ? <span className="block text-[13px] text-muted">{meta}</span> : null}
    </Link>
  </li>
);

function Deadline({ onDone }) {
  const [f, setF] = useState({ title: "", dueDate: "", reportType: "" });
  const add = async () => {
    try {
      await api.post("/api/ops/deadlines", f);
      toast.success("Deadline added");
      setF({ title: "", dueDate: "", reportType: "" });
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <Input label="New deadline" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Input label="Due" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
      <Select label="Met by report" value={f.reportType} onChange={(e) => setF({ ...f, reportType: e.target.value })}>
        <option value="">— manual —</option>
        <option value="periodic">Activity report</option>
        <option value="service_summary">Service summary</option>
        <option value="finance_stock">Finance summary</option>
        <option value="camp_register">Camp register</option>
      </Select>
      <Button variant="outline" disabled={!f.title || !f.dueDate} onClick={add}>
        Add
      </Button>
    </div>
  );
}

export default function Workspace() {
  const [filters, setFilters] = useState({ unit: "", batch: "", academicYear: "", status: "" });
  const w = useResource(() => api.get("/api/ops/workspace", { params: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }).then((r) => r.data), [filters]);
  if (w.status === "error") return <ErrorState error={w.error} onRetry={w.reload} />;
  if (!w.data) return <DashboardSkeleton />;
  const d = w.data;
  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Programme Officer workspace"
        description={d.policy ? `Targets from ${d.policy.name} (v${d.policy.version}). Only approved ledger service counts towards them.` : "No service policy is active, so no volunteer targets are shown. Set one up under Policies & units."}
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-4" role="search" aria-label="Filter workspace">
        <Select label="Unit" value={filters.unit} onChange={(e) => setFilters({ ...filters, unit: e.target.value })}>
          <option value="">All units</option>
          {d.filters.units.map((u) => (
            <option key={u._id} value={u._id}>
              {u.code}
            </option>
          ))}
        </Select>
        <Select label="Batch" value={filters.batch} onChange={(e) => setFilters({ ...filters, batch: e.target.value })}>
          <option value="">All batches</option>
          {d.filters.batches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
        <Input label="Academic year (start)" type="number" value={filters.academicYear} onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })} />
        <Select label="Diary status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Submitted and returned</option>
          <option value="submitted">Submitted only</option>
          <option value="returned">Returned only</option>
        </Select>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Diaries awaiting review" value={d.submitted.total} icon={ClipboardCheck} variant={d.submitted.total ? "mint" : "plain"} />
        <StatCard label="Returned, awaiting resubmission" value={d.returned.total} icon={CornerUpLeft} />
        <StatCard label="Open hours complaints" value={d.grievances.length} icon={MessageSquareWarning} />
        <StatCard label="Below this year's target" value={d.policy ? d.belowTarget.total : "—"} icon={TriangleAlert} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Activities today" description="Events running today.">
          <List items={d.today} empty="Nothing scheduled today." render={(e) => <Item key={e._id} href="/coordinatorlayout/myevents" title={e.title} meta={`${e.location || ""} · ${e.status}`} />} />
        </Panel>
        <Panel title="Next 14 days">
          <List items={d.upcoming} empty="No upcoming activities." render={(e) => <Item key={e._id} href="/coordinatorlayout/myevents" title={e.title} meta={`${formatDate(e.date)}${e.assignedTeacher?.length ? "" : " · no supervisor assigned"}`} />} />
        </Panel>
        <Panel title="Submitted diaries" actions={<Link className="text-[13px] font-semibold underline" href="/coordinatorlayout/diaryreview">Open review</Link>}>
          <List items={d.submitted.items} empty="No diaries awaiting review." render={(e) => <Item key={e._id} href="/coordinatorlayout/diaryreview" title={`${e.student?.name} — ${e.event?.title || "External"}`} meta={`${formatDate(e.serviceDate)} · ${formatMinutes(e.claimedMinutes)}`} />} />
        </Panel>
        <Panel title="Open complaints" actions={<Link className="text-[13px] font-semibold underline" href="/coordinatorlayout/complaints">All complaints</Link>}>
          <List items={d.grievances} empty="No open complaints." render={(g) => <Item key={g._id} href="/coordinatorlayout/complaints" title={`${g.student?.name} — ${GRIEVANCE_LABEL[g.type]}`} meta={`Respond by ${formatDate(g.deadline)}`} />} />
        </Panel>
        <Panel title="Completed activities with no attendance" description="Nobody can claim hours until attendance is recorded.">
          <List items={d.attendanceMissing} empty="All completed activities have attendance." render={(e) => <Item key={e._id} href="/coordinatorlayout/myevents" title={e.title} meta={formatDate(e.date)} />} />
        </Panel>
        <Panel title="Camp preparation" description="Camps not yet reviewed, with materials still needed.">
          <List items={d.camps} empty="No active camps." render={(c) => <Item key={c._id} href={`/coordinatorlayout/camps/${c._id}`} title={c.title} meta={`${formatDate(c.startDate)} – ${formatDate(c.endDate)} · ${c.status.replace("_", " ")}${c.materialsNeeded ? ` · ${c.materialsNeeded} material item(s) still needed` : ""}`} />} />
        </Panel>
        <Panel title="Missing permissions and documents">
          <List
            items={[
              ...d.permissionsPending.map((p) => ({ key: p._id, href: `/coordinatorlayout/projects/${p._id}`, title: p.title, meta: `Pending: ${p.pending.join(", ")}` })),
              ...d.documentsMissing.camps.map((c) => ({ key: c._id, href: `/coordinatorlayout/camps/${c._id}`, title: c.title, meta: `${c.missing} volunteer document(s) not verified` })),
              ...(d.documentsMissing.guardianPermissionsMissing ? [{ key: "g", href: "/coordinatorlayout/reports", title: "Guardian permissions", meta: `${d.documentsMissing.guardianPermissionsMissing} enrolment(s) without guardian permission — generate the pending-documents checklist` }] : []),
            ]}
            empty="Nothing missing."
            render={(x) => <Item key={x.key} href={x.href} title={x.title} meta={x.meta} />}
          />
        </Panel>
        <Panel title="Attendance and finance awaiting action">
          <List
            items={[
              ...(d.attendanceAwaitingVerification ? [{ key: "a", href: "/coordinatorlayout/attendancereview", title: "Attendance awaiting verification", meta: `${d.attendanceAwaitingVerification} self check-in(s) or offline conflict(s)` }] : []),
              ...(d.finance.draftReconciliations ? [{ key: "r", href: "/coordinatorlayout/finance", title: "Reconciliation awaiting approval", meta: `${d.finance.draftReconciliations} draft` }] : []),
              ...(d.finance.unverifiedEntries ? [{ key: "f", href: "/coordinatorlayout/finance", title: "Finance entries awaiting verification", meta: `${d.finance.unverifiedEntries} entr${d.finance.unverifiedEntries === 1 ? "y" : "ies"}` }] : []),
            ]}
            empty="Nothing waiting."
            render={(x) => <Item key={x.key} href={x.href} title={x.title} meta={x.meta} />}
          />
        </Panel>
        <Panel title="Reporting deadlines" description="Met automatically when an approved report of the linked type covers the period.">
          <List
            items={d.deadlines}
            empty="No open deadlines."
            render={(x) => <Item key={x._id} href="/coordinatorlayout/reports" title={`${x.title}${x.met ? " — met" : x.overdue ? " — OVERDUE" : ""}`} meta={`Due ${formatDate(x.dueDate)}${x.reportType ? ` · ${x.reportType.replace("_", " ")}` : ""}`} />}
          />
          <Deadline onDone={w.reload} />
        </Panel>
        {d.policy ? (
          <Panel title="Volunteers below this year's target" description={`Verified regular service under ${hours(d.policy.regularMinutesPerYear)} h this academic year.`} className="lg:col-span-2">
            <List
              items={d.belowTarget.items}
              empty="Everyone is at or above target."
              render={(v) => (
                <li key={v._id} className="flex items-center justify-between gap-2 border-b border-line py-1.5 text-[14px] last:border-0">
                  <span className="flex items-center gap-2">
                    <UserX aria-hidden="true" className="size-4 text-subtle" />
                    {v.name}
                  </span>
                  <span className="tabular text-muted">{hours(v.minutes)} h</span>
                </li>
              )}
            />
          </Panel>
        ) : null}
      </div>

    </>
  );
}
