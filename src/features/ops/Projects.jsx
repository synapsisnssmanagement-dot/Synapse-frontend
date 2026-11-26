"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { FolderKanban, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { CampStatus } from "./campShared";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function NewProject({ open, onClose, onDone, requestId }) {
  const [f, setF] = useState({ kind: "standalone", title: "", description: "", category: "general", communityName: "", adopted: false, location: "", partnerOrg: "", partnerRole: "", goals: "", startDate: "", endDate: "", startTime: "09:00", sessionHours: "2", freq: "weekly", weekdays: [], count: "", permissions: "", budget: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const save = async () => {
    setBusy(true);
    try {
      await api.post("/api/ops/projects", {
        kind: f.kind,
        title: f.title,
        description: f.description,
        category: f.category,
        community: { name: f.communityName, adopted: f.adopted, location: f.location },
        partner: { organisation: f.partnerOrg, contactRole: f.partnerRole },
        goals: f.goals,
        budgetEstimatePaise: Math.round(Number(f.budget || 0) * 100),
        schedule: f.startDate
          ? { startDate: f.startDate, endDate: f.endDate || undefined, startTime: f.startTime, sessionHours: Number(f.sessionHours), location: f.location, recurrence: f.kind === "recurring" ? { freq: f.freq, weekdays: f.weekdays, count: f.count ? Number(f.count) : undefined } : { freq: "none" } }
          : undefined,
        requiredPermissions: f.permissions
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean)
          .map((name) => ({ name, status: "pending" })),
        communityRequest: requestId || undefined,
      });
      toast.success("Project saved as a draft");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={requestId ? "Project from community request" : "New project"} description={requestId ? "The original request is kept unchanged and linked to this project." : undefined} size="lg" footer={<Button variant="dark" onClick={save} loading={busy}>Save draft</Button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Type" value={f.kind} onChange={set("kind")}>
          <option value="standalone">Standalone activity</option>
          <option value="recurring">Recurring sessions</option>
          <option value="long_running">Long-running community project</option>
        </Select>
        <Input label="Title" required value={f.title} onChange={set("title")} />
        <Textarea label="Description" rows={2} value={f.description} onChange={set("description")} containerClassName="sm:col-span-2" />
        <Input label="Community / village" value={f.communityName} onChange={set("communityName")} />
        <Input label="Location" value={f.location} onChange={set("location")} />
        <Checkbox label="Adopted village / community" checked={f.adopted} onChange={set("adopted")} />
        <Input label="Category" value={f.category} onChange={set("category")} />
        <Input label="Partner organisation" value={f.partnerOrg} onChange={set("partnerOrg")} />
        <Input label="Partner contact role" value={f.partnerRole} onChange={set("partnerRole")} hint="A role, not a personal phone number" />
        <Textarea label="Goals and intended outcomes" rows={2} value={f.goals} onChange={set("goals")} containerClassName="sm:col-span-2" />
        <Input label="Start date" type="date" value={f.startDate} onChange={set("startDate")} />
        <Input label="End date" type="date" value={f.endDate} onChange={set("endDate")} />
        <Input label="Start time" type="time" value={f.startTime} onChange={set("startTime")} />
        <Input label="Hours per session" type="number" min={0} max={24} value={f.sessionHours} onChange={set("sessionHours")} />
        {f.kind === "recurring" ? (
          <>
            <Select label="Repeats" value={f.freq} onChange={set("freq")}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly (same date)</option>
            </Select>
            <Input label="Number of sessions" type="number" min={1} max={200} value={f.count} onChange={set("count")} />
            {f.freq === "weekly" ? (
              <fieldset className="sm:col-span-2">
                <legend className="mb-1 text-[13px] font-semibold">On</legend>
                <div className="flex flex-wrap gap-3">
                  {WD.map((d, i) => (
                    <Checkbox key={d} label={d} checked={f.weekdays.includes(i)} onChange={() => setF((x) => ({ ...x, weekdays: x.weekdays.includes(i) ? x.weekdays.filter((y) => y !== i) : [...x.weekdays, i] }))} />
                  ))}
                </div>
              </fieldset>
            ) : null}
          </>
        ) : null}
        <Input label="Budget estimate (₹)" type="number" min={0} value={f.budget} onChange={set("budget")} />
        <Textarea label="Required permissions (one per line)" rows={2} value={f.permissions} onChange={set("permissions")} containerClassName="sm:col-span-2" />
      </div>
    </Modal>
  );
}

const FILTERS = [
  { id: "", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Awaiting approval" },
  { id: "approved", label: "Approved" },
  { id: "scheduled", label: "Scheduled" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "reviewed", label: "Reviewed" },
];

function ProjectsInner({ base = "/coordinatorlayout/projects", canCreate = true }) {
  const params = useSearchParams();
  const requestId = params.get("request");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(Boolean(requestId));
  const list = useResource(() => api.get("/api/ops/projects", { params: { status: status || undefined } }).then((r) => r.data.projects), [status]);
  return (
    <>
      <PageHeader eyebrow="Activities" title="Projects & activities" description="Long-running community projects, recurring sessions and standalone activities. Sessions become events when a project is scheduled, so attendance and diaries work as usual." actions={canCreate ? <Button variant="dark" icon={Plus} onClick={() => setOpen(true)}>New project</Button> : null} />
      <Tabs id="project-filter" label="Filter projects" value={status} onChange={setStatus} tabs={FILTERS} className="mb-4" />
      {list.status === "error" ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <TableSkeleton />
      ) : list.data.length ? (
        <Panel padded={false}>
          <ul>
            {list.data.map((p) => {
              const pending = p.requiredPermissions?.filter((x) => x.status === "pending").length || 0;
              const open = p.followUps?.filter((x) => x.status === "open").length || 0;
              return (
                <li key={p._id} className="border-b border-line last:border-0">
                  <Link href={`${base}/${p._id}`} className="flex flex-col gap-1 px-5 py-3 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="block font-medium text-fg">{p.title}</span>
                      <span className="block text-[13px] text-muted">
                        {p.kind.replace("_", "-")} · {p.community?.name || "—"} · {p.schedule?.startDate ? formatDate(p.schedule.startDate) : "not scheduled"}
                        {pending ? ` · ${pending} permission(s) pending` : ""}
                        {open ? ` · ${open} follow-up(s) open` : ""}
                      </span>
                    </span>
                    <CampStatus status={p.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : (
        <EmptyState icon={FolderKanban} title="No projects here" />
      )}
      {canCreate ? <NewProject open={open} requestId={requestId} onClose={() => setOpen(false)} onDone={list.reload} /> : null}
    </>
  );
}

export default function Projects(props) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ProjectsInner {...props} />
    </Suspense>
  );
}
