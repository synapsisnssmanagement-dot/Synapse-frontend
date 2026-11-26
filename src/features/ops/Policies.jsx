"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, FileCog, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { REQUIREMENT_LABEL, StateBadge, hours } from "./shared";

function PolicyForm({ open, onClose, onSaved, base }) {
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (open && !f && base) {
    setF({
      family: base.family,
      name: base.name,
      purpose: base.purpose || "",
      requirementType: base.requirementType,
      sourceReference: base.sourceReference || "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      hoursPerYear: String(hours(base.rules.regularMinutesPerYear)),
      yearsRequired: String(base.rules.yearsRequired),
      consecutiveYears: base.rules.consecutiveYears,
      campRequired: base.rules.camp?.required,
      campDays: String(base.rules.camp?.requiredDays || 0),
      complaintWindowDays: String(base.rules.complaintWindowDays || 30),
      evidenceRequired: base.rules.evidenceRequired,
      startMonth: String(base.rules.academicYearStartMonth || 6),
      changeReason: "",
    });
  }
  const close = () => {
    setF(null);
    onClose();
  };
  if (!f) return null;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/ops/policies", {
        family: f.family,
        name: f.name,
        purpose: f.purpose,
        requirementType: f.requirementType,
        sourceReference: f.sourceReference,
        effectiveFrom: f.effectiveFrom,
        changeReason: f.changeReason,
        rules: {
          ...base.rules,
          academicYearStartMonth: Number(f.startMonth),
          regularMinutesPerYear: Math.round(Number(f.hoursPerYear) * 60),
          yearsRequired: Number(f.yearsRequired),
          consecutiveYears: f.consecutiveYears,
          camp: { required: f.campRequired, requiredDays: Number(f.campDays) },
          complaintWindowDays: Number(f.complaintWindowDays),
          evidenceRequired: f.evidenceRequired,
        },
      });
      toast.success("Draft version created. Review it, then activate.");
      onSaved();
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : close}
      title="New policy version"
      description="Creates a draft. Existing approvals keep the version they were made under."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" onClick={save} loading={busy}>
            Save draft
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Input label="Name" required value={f.name} onChange={set("name")} />
        <Select label="Requirement type" value={f.requirementType} onChange={set("requirementType")}>
          {Object.entries(REQUIREMENT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Input label="Source document / reference" value={f.sourceReference} onChange={set("sourceReference")} hint="Required before a national requirement can be activated." />
        <Textarea label="Purpose" rows={2} value={f.purpose} onChange={set("purpose")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Effective from" type="date" value={f.effectiveFrom} onChange={set("effectiveFrom")} />
          <Input label="Year starts in month (1–12)" type="number" min={1} max={12} value={f.startMonth} onChange={set("startMonth")} />
          <Input label="Complaint window (days)" type="number" min={1} max={365} value={f.complaintWindowDays} onChange={set("complaintWindowDays")} />
          <Input label="Regular hours per year" type="number" min={0} value={f.hoursPerYear} onChange={set("hoursPerYear")} />
          <Input label="Years required" type="number" min={0} max={6} value={f.yearsRequired} onChange={set("yearsRequired")} />
          <Input label="Camp days required" type="number" min={0} max={60} value={f.campDays} onChange={set("campDays")} />
        </div>
        <Checkbox label="Years must be consecutive" checked={f.consecutiveYears} onChange={set("consecutiveYears")} />
        <Checkbox label="Special camp required" checked={f.campRequired} onChange={set("campRequired")} />
        <Checkbox label="Evidence required on every diary entry" checked={f.evidenceRequired} onChange={set("evidenceRequired")} />
        <Textarea label="Reason for this version (required)" rows={2} value={f.changeReason} onChange={set("changeReason")} />
        {error ? (
          <p role="alert" className="text-[13px] font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function Recalculate({ policies, volunteers }) {
  const [f, setF] = useState({ student: "", policy: "" });
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState("");
  const run = async (record) => {
    try {
      const r = await api.post("/api/ops/policies/recalculate", { ...f, record, reason });
      if (record) {
        toast.success("Recalculation recorded. Credits were not changed.");
        setPreview(null);
        setReason("");
      } else setPreview(r.data);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Panel title="Recalculate under a different policy" description="Compares a volunteer's verified service under another policy version. Credits keep the version they were approved under; recording only documents the comparison." className="mt-6">
      <div className="grid gap-2 sm:grid-cols-3 sm:items-end">
        <Select label="Volunteer" value={f.student} onChange={(e) => setF({ ...f, student: e.target.value })} placeholder="Choose volunteer">
          {volunteers.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
          ))}
        </Select>
        <Select label="Policy version" value={f.policy} onChange={(e) => setF({ ...f, policy: e.target.value })} placeholder="Choose version">
          {policies.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} v{p.version} ({p.status})
            </option>
          ))}
        </Select>
        <Button variant="outline" disabled={!f.student || !f.policy} onClick={() => run(false)}>
          Preview
        </Button>
      </div>
      {preview ? (
        <div className="mt-3 grid gap-2 text-[13px]" role="status">
          <p>
            Recorded under version(s): {preview.originalPolicyVersions.join(", ") || "none"} → {preview.before.map((b) => `v${b.version}: ${b.met ? "met" : "not met"}`).join("; ") || "—"}
          </p>
          <p>
            Under the selected version: <strong>{preview.after.met ? "met" : "not met"}</strong> (qualifying years {preview.after.qualifyingYears.length}/{preview.after.yearsRequired}; camp {preview.after.camp.met ? "met" : "not met"})
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input label="Reason for recording (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button variant="dark" onClick={() => run(true)}>
              Record recalculation
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export default function Policies() {
  const policies = useResource(() => api.get("/api/ops/policies").then((r) => r.data.policies), []);
  const units = useResource(() => api.get("/api/ops/units").then((r) => r.data.units), []);
  const enrolments = useResource(() => api.get("/api/ops/enrolments").then((r) => r.data.enrolments), []);
  const volunteers = useResource(() => getList("/api/coordinator/volunteers", "volunteers"), []);
  const [base, setBase] = useState(null);
  const [activate, setActivate] = useState(null);
  const [reason, setReason] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unit, setUnit] = useState({ name: "", code: "", level: "college" });
  const [enrol, setEnrol] = useState({ unit: "", student: "", academicYear: String(new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1), batch: "", level: "UG" });

  const newFromTemplate = async () => {
    try {
      setBase((await api.get("/api/ops/policies/template")).data.template);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const doActivate = async () => {
    setBusy(true);
    try {
      await api.post(`/api/ops/policies/${activate._id}/activate`, { reason, verifiedByInstitution: verified });
      toast.success(`Version ${activate.version} is now active`);
      setActivate(null);
      setReason("");
      policies.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const addUnit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/ops/units", unit);
      toast.success("Unit created");
      setUnit({ name: "", code: "", level: "college" });
      units.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  const addEnrolment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/ops/enrolments", { ...enrol, academicYear: Number(enrol.academicYear) });
      toast.success("Volunteer enrolled");
      enrolments.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader eyebrow="Setup" title="Policies, units & enrolment" description="Service targets come from versioned policies you configure and verify. The built-in template is an unverified draft, not an official preset." actions={<Button variant="dark" icon={FileCog} onClick={newFromTemplate}>New policy from template</Button>} />

      <Panel title="Service policies" className="mb-6" padded={false}>
        {policies.status === "error" ? (
          <ErrorState error={policies.error} onRetry={policies.reload} />
        ) : !policies.data ? (
          <TableSkeleton rows={3} />
        ) : policies.data.length ? (
          <ul>
            {policies.data.map((p) => (
              <li key={p._id} className="flex flex-col gap-2 border-b border-line px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-fg">
                    {p.name} <span className="text-muted">v{p.version}</span>
                  </p>
                  <p className="text-[13px] text-muted">
                    {REQUIREMENT_LABEL[p.requirementType]} · from {formatDate(p.effectiveFrom)}
                    {p.effectiveTo ? ` to ${formatDate(p.effectiveTo)}` : ""} · {hours(p.rules.regularMinutesPerYear)} h × {p.rules.yearsRequired} yr
                    {p.rules.camp?.required ? ` + ${p.rules.camp.requiredDays}-day camp` : ""} · source: {p.sourceReference || "none"}
                  </p>
                  <p className="text-[13px] text-fg-2">Reason: {p.changeReason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StateBadge state={p.status} />
                  <Button size="sm" variant="outline" onClick={() => setBase(p)}>
                    New version
                  </Button>
                  {p.status === "draft" ? (
                    <Button size="sm" variant="dark" onClick={() => setActivate(p)}>
                      Activate
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={FileCog} title="No policies yet" description="Create one from the draft template and check it against your NSS documents." />
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="NSS units" description="An institution can run several units.">
          <ul className="mb-4 grid gap-1 text-[14px]">
            {(units.data || []).map((u) => (
              <li key={u._id}>
                <strong>{u.code}</strong> — {u.name} ({u.level === "higher_secondary" ? "Higher secondary" : "College"})
              </li>
            ))}
            {units.data && !units.data.length ? <li className="text-muted">No units yet.</li> : null}
          </ul>
          <form onSubmit={addUnit} className="grid gap-3 sm:grid-cols-3">
            <Input label="Unit name" required value={unit.name} onChange={(e) => setUnit({ ...unit, name: e.target.value })} />
            <Input label="Unit code" required value={unit.code} onChange={(e) => setUnit({ ...unit, code: e.target.value })} />
            <Select label="Level" value={unit.level} onChange={(e) => setUnit({ ...unit, level: e.target.value })}>
              <option value="college">College</option>
              <option value="higher_secondary">Higher secondary (XI/XII)</option>
            </Select>
            <Button type="submit" variant="outline" icon={Building2} className="sm:col-span-3">
              Add unit
            </Button>
          </form>
        </Panel>
        <Panel title="Enrol a volunteer">
          <form onSubmit={addEnrolment} className="grid gap-3 sm:grid-cols-2">
            <Select label="Unit" required value={enrol.unit} onChange={(e) => setEnrol({ ...enrol, unit: e.target.value })} placeholder="Choose unit">
              {(units.data || []).map((u) => (
                <option key={u._id} value={u._id}>
                  {u.code}
                </option>
              ))}
            </Select>
            <Select label="Volunteer" required value={enrol.student} onChange={(e) => setEnrol({ ...enrol, student: e.target.value })} placeholder="Choose volunteer">
              {(volunteers.data || []).map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </Select>
            <Input label="Academic year (start)" type="number" value={enrol.academicYear} onChange={(e) => setEnrol({ ...enrol, academicYear: e.target.value })} />
            <Input label="Batch" value={enrol.batch} onChange={(e) => setEnrol({ ...enrol, batch: e.target.value })} />
            <Select label="Level" value={enrol.level} onChange={(e) => setEnrol({ ...enrol, level: e.target.value })}>
              {["UG", "PG", "XI", "XII", "community_service"].map((l) => (
                <option key={l} value={l}>
                  {l === "community_service" ? "Community service (not NSS)" : l}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="outline" icon={UserPlus} className="self-end">
              Enrol
            </Button>
          </form>
          <p className="mt-4 text-[13px] text-muted">{enrolments.data ? `${enrolments.data.length} enrolment(s) recorded.` : ""}</p>
        </Panel>
      </div>

      <Recalculate policies={policies.data || []} volunteers={volunteers.data || []} />

      <PolicyForm open={Boolean(base)} base={base} onClose={() => setBase(null)} onSaved={policies.reload} />
      <ConfirmDialog
        open={Boolean(activate)}
        onClose={() => setActivate(null)}
        onConfirm={doActivate}
        loading={busy}
        tone="info"
        title={`Activate version ${activate?.version}?`}
        confirmLabel="Activate"
        description="Older active versions of this policy will be retired from this version's start date. Existing approvals keep their recorded version."
      >
        <div className="mt-4 grid gap-3">
          <Textarea label="Reason (required)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Checkbox label="The values have been checked against our institution's official documents" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
        </div>
      </ConfirmDialog>
    </>
  );
}
