"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Tent } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { CampStatus } from "./campShared";

const DOCS = ["guardian_consent", "fitness_declaration", "institution_permission", "id_proof"];

function NewCamp({ open, onClose, onDone }) {
  const teachers = useResource(() => getList("/api/coordinator/teachers", "teachers").catch(() => []), []);
  const [f, setF] = useState({ title: "", startDate: "", endDate: "", capacity: "50", community: "", address: "", hostOrganisation: "", needs: "", objectives: "", guardianPermissionRequired: false, requiredDocuments: [], supervisors: [] });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const save = async () => {
    setBusy(true);
    try {
      await api.post("/api/ops/camps", { ...f, capacity: Number(f.capacity), site: { community: f.community, address: f.address, hostOrganisation: f.hostOrganisation, needs: f.needs } });
      toast.success("Camp proposal saved as a draft");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="New camp proposal" size="lg" footer={<Button variant="dark" onClick={save} loading={busy}>Save draft</Button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Title" required value={f.title} onChange={set("title")} containerClassName="sm:col-span-2" />
        <Input label="Start date" type="date" required value={f.startDate} onChange={set("startDate")} />
        <Input label="End date" type="date" required value={f.endDate} onChange={set("endDate")} />
        <Input label="Capacity" type="number" min={1} value={f.capacity} onChange={set("capacity")} />
        <Input label="Adopted village / community" value={f.community} onChange={set("community")} />
        <Input label="Site address" value={f.address} onChange={set("address")} containerClassName="sm:col-span-2" />
        <Input label="Host organisation" value={f.hostOrganisation} onChange={set("hostOrganisation")} />
        <Textarea label="Identified community needs" rows={2} value={f.needs} onChange={set("needs")} containerClassName="sm:col-span-2" />
        <Textarea label="Objectives" rows={2} value={f.objectives} onChange={set("objectives")} containerClassName="sm:col-span-2" />
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-[13px] font-semibold">Required documents (status is tracked; files are not uploaded here)</legend>
          <div className="flex flex-wrap gap-3">
            {DOCS.map((d) => (
              <Checkbox key={d} label={d.replace(/_/g, " ")} checked={f.requiredDocuments.includes(d)} onChange={() => toggle("requiredDocuments", d)} />
            ))}
          </div>
        </fieldset>
        <Checkbox label="Guardian permission required for all volunteers" checked={f.guardianPermissionRequired} onChange={set("guardianPermissionRequired")} />
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-[13px] font-semibold">Supervisors</legend>
          <div className="flex flex-wrap gap-3">
            {(teachers.data || []).map((t) => (
              <Checkbox key={t._id} label={t.name} checked={f.supervisors.includes(t._id)} onChange={() => toggle("supervisors", t._id)} />
            ))}
            {teachers.data && !teachers.data.length ? <p className="text-[13px] text-muted">No teachers found.</p> : null}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}

export default function Camps({ base = "/coordinatorlayout/camps", canCreate = true }) {
  const camps = useResource(() => api.get("/api/ops/camps").then((r) => r.data.camps), []);
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="Special camps"
        title="Camp operations"
        description="Proposal and approval, volunteer selection and waiting list, documents, teams, logistics, incidents, closing report and completion review. Daily roll call and the camp diary stay on each camp's existing page."
        actions={canCreate ? <Button variant="dark" icon={Plus} onClick={() => setOpen(true)}>New proposal</Button> : null}
      />
      {camps.status === "error" ? (
        <ErrorState error={camps.error} onRetry={camps.reload} />
      ) : !camps.data ? (
        <TableSkeleton />
      ) : camps.data.length ? (
        <Panel padded={false}>
          <ul>
            {camps.data.map((c) => (
              <li key={c._id} className="border-b border-line last:border-0">
                <Link href={`${base}/${c._id}`} className="flex flex-col gap-1 px-5 py-3 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block font-medium text-fg">{c.title}</span>
                    <span className="block text-[13px] text-muted">
                      {formatDate(c.startDate)} – {formatDate(c.endDate)} · capacity {c.capacity} · {c.applicationCounts.confirmed || 0} confirmed, {c.applicationCounts.waitlisted || 0} waiting
                    </span>
                  </span>
                  <CampStatus status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState icon={Tent} title="No camps yet" description={canCreate ? "Create a proposal to start planning." : "Camps you supervise appear here."} />
      )}
      {canCreate ? <NewCamp open={open} onClose={() => setOpen(false)} onDone={camps.reload} /> : null}
    </>
  );
}
