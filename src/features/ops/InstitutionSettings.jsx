"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";

function ChainEditor({ label, chain, people, onChange }) {
  const set = (i, patch) => onChange(chain.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-[14px] font-semibold">{label}</legend>
      {chain.map((s, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
          <span className="text-[13px] text-muted">Step {i + 1}</span>
          <Input label="Step name" value={s.name} onChange={(e) => set(i, { name: e.target.value })} />
          <Select label="Approver" value={s.approvers?.[0] || ""} onChange={(e) => set(i, { approvers: e.target.value ? [e.target.value] : [] })}>
            <option value="">Any active Programme Officer</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.kind})
              </option>
            ))}
          </Select>
          <IconButton label={`Remove step ${i + 1}`} icon={Trash2} disabled={chain.length === 1} onClick={() => onChange(chain.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button size="sm" variant="ghost" icon={Plus} disabled={chain.length >= 5} onClick={() => onChange([...chain, { name: "", approvers: [] }])} className="w-fit">
        Add step
      </Button>
    </fieldset>
  );
}

export default function InstitutionSettings() {
  const s = useResource(() => api.get("/api/ops/settings").then((r) => r.data.settings), []);
  const people = useResource(() => api.get("/api/ops/officers").then((r) => [...r.data.officers.map((o) => ({ ...o, kind: "officer" })), ...r.data.teachers.map((t) => ({ ...t, kind: "teacher" }))]), []);
  const [draft, setDraft] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (s.status === "error") return <ErrorState error={s.error} onRetry={s.reload} />;
  if (!s.data) return <TableSkeleton />;
  const d = draft || { kind: s.data.kind, privacy: s.data.privacy, approvalChains: s.data.approvalChains };
  const update = (patch) => setDraft({ ...d, ...patch });
  const save = async () => {
    setBusy(true);
    try {
      await api.put("/api/ops/settings", { ...d, reason });
      toast.success("Settings saved");
      setDraft(null);
      setReason("");
      s.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader eyebrow="Setup" title="Institution settings" description="Who approves projects and camps, your institution type, and privacy defaults for school students. Every change needs a reason and is kept in history." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Institution type & privacy">
          <div className="grid gap-3">
            <Select label="Institution type" value={d.kind} onChange={(e) => update({ kind: e.target.value })}>
              <option value="college">College / university</option>
              <option value="higher_secondary_school">Higher secondary school (Class XI/XII NSS)</option>
              <option value="school_with_lower_classes">School with lower classes (community service, not NSS)</option>
            </Select>
            <Select label="Class XI/XII and community-service students on the leaderboard" value={d.privacy.minorsPublicProfile} onChange={(e) => update({ privacy: { ...d.privacy, minorsPublicProfile: e.target.value } })}>
              <option value="hidden">Hidden (recommended)</option>
              <option value="first_name_only">First name only, no photo or department</option>
            </Select>
            <p className="text-[12.5px] text-muted">Student contact details, guardian information, medical documents and location history are never shown on public pages.</p>
          </div>
        </Panel>
        <Panel title="Approval chains" description="Steps are signed in order by different people.">
          <div className="grid gap-5">
            <ChainEditor label="Projects & activities" chain={d.approvalChains.project} people={people.data || []} onChange={(c) => update({ approvalChains: { ...d.approvalChains, project: c } })} />
            <ChainEditor label="Special camps" chain={d.approvalChains.camp} people={people.data || []} onChange={(c) => update({ approvalChains: { ...d.approvalChains, camp: c } })} />
          </div>
        </Panel>
      </div>
      <Panel className="mt-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input label="Reason for this change (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button variant="dark" loading={busy} disabled={!draft} onClick={save}>
            Save settings
          </Button>
        </div>
        <ul className="mt-3 grid gap-0.5 text-[12.5px] text-muted">
          {s.data.history
            .slice()
            .reverse()
            .map((h, i) => (
              <li key={i}>
                {formatDate(h.at)} · {h.change}
              </li>
            ))}
        </ul>
      </Panel>
    </>
  );
}
