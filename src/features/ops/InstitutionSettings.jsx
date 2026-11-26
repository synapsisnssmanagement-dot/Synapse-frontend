"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Building2, EyeOff, GraduationCap, History, Plus, School, ShieldCheck, Trash2, UserRound } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";

const KINDS = [
  { value: "college", icon: Building2, title: "College / university", text: "Undergraduate and postgraduate NSS units." },
  { value: "higher_secondary_school", icon: School, title: "Higher secondary school", text: "Class XI/XII NSS; guardian permission is tracked." },
  { value: "school_with_lower_classes", icon: GraduationCap, title: "School with lower classes", text: "Lower classes do community service, recorded separately and never counted as NSS." },
];
const PRIVACY = [
  { value: "hidden", icon: EyeOff, title: "Hidden", text: "Class XI/XII and community-service students don't appear on the leaderboard to others.", recommended: true },
  { value: "first_name_only", icon: UserRound, title: "First name only", text: "Shown with first name only — no photo or department." },
];

// Accessible radio-card group.
function Choice({ legend, name, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13.5px] font-semibold text-fg">{legend}</legend>
      <div className="grid gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label key={o.value} className={cx("flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors", on ? "border-brand bg-mint/60" : "border-line bg-paper hover:border-line-strong")}>
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              <span className={cx("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg", on ? "bg-brand text-ink" : "bg-mist text-fg-2")} aria-hidden="true">
                <o.icon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-fg">
                  {o.title}
                  {o.recommended ? <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-fg-2">Recommended</span> : null}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{o.text}</span>
              </span>
              <span className={cx("mt-1 size-4 shrink-0 rounded-full border-2", on ? "border-brand bg-brand shadow-[inset_0_0_0_3px_white]" : "border-line-strong")} aria-hidden="true" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ChainEditor({ label, hint, chain, people, onChange }) {
  const set = (i, patch) => onChange(chain.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const nameOf = (id) => people.find((p) => p._id === id)?.name;
  return (
    <section aria-label={label}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-fg">{label}</h3>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      <p className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg bg-canvas px-3 py-2 text-[12.5px] text-fg-2">
        <span className="font-medium text-muted">Flow:</span>
        {chain.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i ? <ArrowRight aria-hidden="true" className="size-3.5 text-subtle" /> : null}
            <span className="font-medium text-fg">{s.name || `Step ${i + 1}`}</span>
            {s.approvers?.[0] ? <span className="text-muted">({nameOf(s.approvers[0]) || "named"})</span> : null}
          </span>
        ))}
        <ArrowRight aria-hidden="true" className="size-3.5 text-subtle" />
        <span className="font-medium text-brand-700">Approved</span>
      </p>
      <ol className="grid gap-3">
        {chain.map((s, i) => (
          <li key={i} className="relative flex gap-3">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-paper">{i + 1}</span>
              {i < chain.length - 1 ? <span className="mt-1 w-px flex-1 bg-line-strong" /> : null}
            </div>
            <div className="grid min-w-0 flex-1 gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
              <Input label={`Step ${i + 1} name`} placeholder="e.g. Principal" value={s.name} onChange={(e) => set(i, { name: e.target.value })} />
              <Select label="Who approves" value={s.approvers?.[0] || ""} onChange={(e) => set(i, { approvers: e.target.value ? [e.target.value] : [] })}>
                <option value="">Any Programme Officer</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} · {p.kind}
                  </option>
                ))}
              </Select>
            </div>
            <IconButton label={`Remove step ${i + 1}`} icon={Trash2} className="mt-7 shrink-0" disabled={chain.length === 1} onClick={() => onChange(chain.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ol>
      <Button size="sm" variant="ghost" icon={Plus} disabled={chain.length >= 5} onClick={() => onChange([...chain, { name: "", approvers: [] }])} className="mt-2 ml-9">
        Add step
      </Button>
    </section>
  );
}

export default function InstitutionSettings() {
  const s = useResource(() => api.get("/api/ops/settings").then((r) => r.data.settings), []);
  const people = useResource(() => api.get("/api/ops/officers").then((r) => [...r.data.officers.map((o) => ({ ...o, kind: "Programme Officer" })), ...r.data.teachers.map((t) => ({ ...t, kind: "Teacher" }))]), []);
  const [draft, setDraft] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (s.status === "error") return <ErrorState error={s.error} onRetry={s.reload} />;
  if (!s.data) return <TableSkeleton />;
  const d = draft || { kind: s.data.kind, privacy: s.data.privacy, approvalChains: s.data.approvalChains };
  const update = (patch) => setDraft({ ...d, ...patch });
  const dirty = Boolean(draft);
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
      <PageHeader eyebrow="Setup" title="Institution settings" description="Who approves projects and camps, what kind of institution this is, and privacy defaults for school students. Every change needs a reason and is kept in history." />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel title="Institution type & privacy">
          <div className="grid gap-6">
            <Choice legend="Institution type" name="kind" options={KINDS} value={d.kind} onChange={(kind) => update({ kind })} />
            <Choice legend="Class XI/XII and community-service students on the leaderboard" name="privacy" options={PRIVACY} value={d.privacy.minorsPublicProfile} onChange={(v) => update({ privacy: { ...d.privacy, minorsPublicProfile: v } })} />
            <p className="flex gap-2 rounded-lg bg-canvas p-3 text-[12.5px] leading-relaxed text-muted">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
              Student contact details, guardian information, medical documents and location history are never shown on public pages, whatever is chosen here.
            </p>
          </div>
        </Panel>

        <Panel title="Approval chains" description="Each step is signed in order, by a different person. Leave the approver as “Any Programme Officer” unless a specific person must sign.">
          <div className="grid gap-7">
            <ChainEditor label="Projects & activities" hint="Before sessions can be scheduled" chain={d.approvalChains.project} people={people.data || []} onChange={(c) => update({ approvalChains: { ...d.approvalChains, project: c } })} />
            <div className="border-t border-line" />
            <ChainEditor label="Special camps" hint="Before volunteers can apply" chain={d.approvalChains.camp} people={people.data || []} onChange={(c) => update({ approvalChains: { ...d.approvalChains, camp: c } })} />
          </div>
        </Panel>
      </div>

      <Panel title="Change history" description="Every saved change, newest first." className="mt-4">
        {s.data.history.length ? (
          <ol className="grid gap-2">
            {s.data.history
              .slice()
              .reverse()
              .map((h, i) => (
                <li key={i} className="flex gap-3 text-[13px]">
                  <History aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-subtle" />
                  <span>
                    <span className="font-medium text-fg">{formatDate(h.at)}</span> <span className="text-fg-2">— {h.change}</span>
                  </span>
                </li>
              ))}
          </ol>
        ) : (
          <p className="text-[13px] text-muted">No changes yet. The defaults are in use.</p>
        )}
      </Panel>

      {/* Sticky save bar: visible whenever there are unsaved changes. */}
      <div className={cx("sticky bottom-4 z-10 mt-4 transition-all", dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} aria-hidden={!dirty}>
        <div className="flex flex-col gap-3 rounded-xl border border-line-strong bg-paper p-4 shadow-lg sm:flex-row sm:items-end">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-700 sm:mb-3 sm:w-36 sm:shrink-0">
            <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" /> Unsaved changes
          </p>
          <Input label="Reason for this change (required)" placeholder="e.g. Principal must approve camps from this year" value={reason} onChange={(e) => setReason(e.target.value)} containerClassName="flex-1" tabIndex={dirty ? 0 : -1} />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setDraft(null); setReason(""); }} disabled={busy} tabIndex={dirty ? 0 : -1}>
              Discard
            </Button>
            <Button variant="dark" loading={busy} disabled={reason.trim().length < 3} onClick={save} tabIndex={dirty ? 0 : -1}>
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
