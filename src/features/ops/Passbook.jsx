"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, Clock3, Download, MessageSquareWarning, NotebookPen, Plus, Printer, Tent } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import cx from "@/lib/cx";
import Progress from "@/components/ui/Progress";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { StatRowSkeleton } from "@/components/ui/Skeleton";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { GRIEVANCE_LABEL, REQUIREMENT_LABEL, StateBadge, formatMinutes, hours, openPdf } from "./shared";

const blank = { kind: "activity", externalOrganisation: "", event: "", serviceDate: "", claimedMinutes: "", category: "general", workDone: "", reflection: "", outcomes: "" };

function DiaryForm({ open, onClose, entry, activities, onSaved }) {
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadedFor, setLoadedFor] = useState(null);
  const key = entry?._id || (open ? "new" : null);
  if (open && loadedFor !== key) {
    setLoadedFor(key);
    setError("");
    setForm(
      entry
        ? {
            kind: entry.kind === "external" ? "external" : "activity",
            externalOrganisation: entry.externalOrganisation || "",
            event: entry.event?._id || entry.event || "",
            serviceDate: entry.serviceDate?.slice(0, 10) || "",
            claimedMinutes: String(entry.claimedMinutes || ""),
            category: entry.category || "general",
            workDone: entry.workDone || "",
            reflection: entry.reflection || "",
            outcomes: entry.outcomes || "",
          }
        : blank
    );
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (submit) => {
    setError("");
    const minutes = Number(form.claimedMinutes);
    const external = form.kind === "external";
    if (!external && !form.event) return setError("Choose the activity.");
    if (external && form.externalOrganisation.trim().length < 2) return setError("Name the organisation you served with.");
    if (!form.serviceDate) return setError("Enter the date you served.");
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return setError("Enter the time you actually took part, in whole minutes.");
    if (form.workDone.trim().length < 3) return setError("Describe the work you did.");
    setBusy(true);
    try {
      const { kind: _kind, ...rest } = form;
      const body = external ? { ...rest, kind: "external", event: null, claimedMinutes: minutes } : { ...rest, kind: "regular", externalOrganisation: "", claimedMinutes: minutes };
      const saved = entry ? await api.patch(`/api/ops/diary/${entry._id}`, body) : await api.post("/api/ops/diary", body);
      if (submit) await api.post(`/api/ops/diary/${saved.data.entry._id}/submit`);
      toast.success(submit ? "Submitted for review" : "Draft saved");
      onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const lastDecision = entry?.decisions?.at?.(-1);
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={entry ? (entry.status === "returned" ? "Correct and resubmit" : "Edit diary entry") : "New diary entry"}
      description="Record the time you actually took part, not the whole event length."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => save(false)} disabled={busy}>
            Save draft
          </Button>
          <Button variant="dark" onClick={() => save(true)} loading={busy}>
            Submit for review
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {lastDecision && entry?.status === "returned" ? (
          <p className="rounded-lg border border-line bg-canvas p-3 text-[13px] text-fg-2" role="status">
            <strong>Reviewer feedback:</strong> {lastDecision.reason}
          </p>
        ) : null}
        <Select label="Type of service" value={form.kind} onChange={set("kind")}>
          <option value="activity">An activity of my NSS unit</option>
          <option value="external">Approved external service (separate officer review)</option>
        </Select>
        {form.kind === "external" ? (
          <Input label="Organisation" required value={form.externalOrganisation} onChange={set("externalOrganisation")} hint="Only claim service your Programme Officer agreed to in advance." />
        ) : (
          <Select label="Activity" required value={form.event} onChange={set("event")} placeholder="Choose an activity">
            {activities.map((a) => (
              <option key={a._id} value={a._id}>
                {a.title} — {formatDate(a.date)}
                {a.type === "special_camp" ? " (camp)" : ""}
              </option>
            ))}
          </Select>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Date served" type="date" required value={form.serviceDate} onChange={set("serviceDate")} />
          <Input label="Minutes taken part" type="number" inputMode="numeric" min={1} max={1440} required value={form.claimedMinutes} onChange={set("claimedMinutes")} hint="e.g. 150 for 2½ hours" />
          <Input label="Category" value={form.category} onChange={set("category")} maxLength={80} />
        </div>
        <Textarea label="Work performed" required value={form.workDone} onChange={set("workDone")} maxLength={4000} />
        <Textarea label="What you learned" rows={3} value={form.reflection} onChange={set("reflection")} maxLength={4000} />
        <Textarea label="Outcomes you observed" rows={2} value={form.outcomes} onChange={set("outcomes")} maxLength={2000} hint="Reported by you; supervisors verify outcomes separately." />
        {error ? (
          <p role="alert" className="text-[13px] font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function ComplaintForm({ open, onClose, target, onSaved }) {
  const [type, setType] = useState("missing_hours");
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/ops/grievances", { type, explanation, ...target });
      toast.success("Complaint raised. You'll see each response here.");
      setExplanation("");
      onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Raise an hours complaint"
      description="A Programme Officer reviews it. Any correction appears as a separate, recorded adjustment."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" onClick={send} loading={busy}>
            Raise complaint
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Select label="What is wrong?" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(GRIEVANCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Textarea label="Explain" required value={explanation} onChange={(e) => setExplanation(e.target.value)} hint="At least 10 characters. Mention who supervised you." />
        {error ? (
          <p role="alert" className="text-[13px] font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

const TABS = [
  { id: "ledger", label: "Verified service" },
  { id: "pending", label: "Awaiting review" },
  { id: "returned", label: "Returned" },
  { id: "drafts", label: "Drafts" },
  { id: "rejected", label: "Rejected" },
  { id: "complaints", label: "Complaints" },
];

export default function Passbook() {
  const tabsId = useId();
  const pb = useResource(() => api.get("/api/ops/passbook/me").then((r) => r.data), []);
  const acts = useResource(() => api.get("/api/ops/diary/activities").then((r) => r.data.events), []);
  const comp = useResource(() => api.get("/api/ops/grievances/me").then((r) => r.data.grievances), []);
  const certs = useResource(() => api.get("/api/ops/certificates").then((r) => r.data.certificates), []);
  const [tab, setTab] = useState("ledger");
  const [editing, setEditing] = useState(null); // null | "new" | entry
  const [complaint, setComplaint] = useState(null);

  const d = pb.data;
  const reloadAll = () => {
    pb.reload();
    comp.reload();
  };
  const counts = useMemo(
    () => ({ ledger: d?.entries?.length || 0, pending: d?.pending?.length || 0, returned: d?.returned?.length || 0, drafts: d?.drafts?.length || 0, rejected: d?.rejected?.length || 0, complaints: comp.data?.length || 0 }),
    [d, comp.data]
  );

  const exportCsv = () =>
    downloadCsv("service-passbook.csv", [
      ["date", "activity type", "category", "entry type", "minutes", "policy version", "reason"],
      ...(d?.entries || []).map((e) => [e.serviceDate?.slice(0, 10), e.kind, e.category, e.entryType, e.minutes, e.policyVersion ?? "", e.reason || ""]),
    ]);

  const row = (e, actions) => (
    <li key={e._id} className="flex flex-col gap-2 border-b border-line px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-fg">{e.event?.title || e.externalOrganisation || "Service"}</p>
        <p className="text-[13px] text-muted">
          {formatDate(e.serviceDate)} · {formatMinutes(e.claimedMinutes)} claimed · {e.category}
        </p>
        {e.decisions?.length ? <p className="mt-1 text-[13px] text-fg-2">Reviewer: {e.decisions.at(-1).reason || "—"}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StateBadge state={e.status} />
        {actions}
      </div>
    </li>
  );

  return (
    <>
      <PageHeader
        eyebrow="Service"
        title="Diary & service passbook"
        description="Verified service is what a supervisor approved. Pending claims and imported legacy totals are shown separately and never mixed in."
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" icon={Printer} onClick={() => window.print()} disabled={!d}>
              Print
            </Button>
            <Button variant="outline" icon={Download} onClick={exportCsv} disabled={!d?.entries?.length}>
              CSV
            </Button>
            <Button variant="dark" icon={Plus} onClick={() => setEditing("new")}>
              New diary entry
            </Button>
          </div>
        }
      />

      {pb.status === "error" ? (
        <ErrorState title="Couldn't load your passbook" description={errorMessage(pb.error)} onRetry={pb.reload} />
      ) : !d ? (
        <StatRowSkeleton />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Verified regular service" value={hours(d.summary.verifiedRegularMinutes)} unit="h" icon={CheckCircle2} variant="mint" />
            <StatCard label="Verified camp service" value={hours(d.summary.verifiedCampMinutes)} unit="h" icon={Tent} />
            <StatCard label="Awaiting review" value={hours(d.summary.pendingMinutes)} unit="h" icon={Clock3} footnote="Not counted until approved" />
            <StatCard label="Legacy (imported)" value={hours(d.summary.legacyMinutes)} unit="h" icon={BookOpen} footnote="From older attendance records" />
          </div>

          <div className={cx("mb-6 grid gap-4", d.campProgress.length && "lg:grid-cols-[1.6fr_1fr]")}>
            {d.evaluations.length ? (
              d.evaluations.map(({ policy, result }) => {
                const steps = [];
                if (result.regularMinutesPerYear) {
                  steps.push({
                    key: "years",
                    done: result.qualifyingYears.length >= result.yearsRequired,
                    title: `Regular service: ${hours(result.regularMinutesPerYear)} h a year for ${result.yearsRequired} year${result.yearsRequired === 1 ? "" : "s"}${result.consecutiveYears ? " in a row" : ""}`,
                    note: `${result.qualifyingYears.length} of ${result.yearsRequired} done`,
                    body: result.years.length ? (
                      result.years.map((y) => <Progress key={y.year} className="mt-2" label={y.label} value={Math.min(y.minutes, result.regularMinutesPerYear)} max={result.regularMinutesPerYear} valueLabel={`${hours(y.minutes)} / ${hours(result.regularMinutesPerYear)} h`} />)
                    ) : (
                      <p className="mt-1 text-[13px] text-muted">No approved hours yet. Write a diary entry after each activity.</p>
                    ),
                  });
                }
                result.categories.forEach((c) =>
                  steps.push({
                    key: c.name,
                    done: c.done >= c.required,
                    title: c.name,
                    note: `${formatMinutes(c.done)} / ${formatMinutes(c.required)}`,
                    body: <Progress className="mt-2" value={Math.min(c.done, c.required)} max={c.required || 1} />,
                  })
                );
                if (result.camp.required) {
                  steps.push({ key: "camp", done: result.camp.met, title: `Special camp (${result.camp.requiredDays} days)`, note: result.camp.met ? "Complete" : "Not yet" });
                }
                const doneCount = steps.filter((st) => st.done).length;
                return (
                  <section key={policy._id} className="rounded-2xl border border-line/70 bg-paper p-5 shadow-subtle sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-fg">Your NSS certificate progress</h2>
                        <p className="mt-0.5 text-[13px] text-muted">
                          {REQUIREMENT_LABEL[policy.requirementType]} · policy v{policy.version}
                        </p>
                      </div>
                      <span className={cx("rounded-full px-3 py-1 text-[12.5px] font-semibold", result.met ? "bg-mint text-brand-700" : "bg-sun text-amber-800")}>
                        {result.met ? "Eligible" : `${doneCount} of ${steps.length} complete`}
                      </span>
                    </div>
                    {!policy.verifiedByInstitution ? (
                      <p className="mt-3 rounded-xl bg-sun px-3.5 py-2.5 text-[12.5px] text-amber-900">These rules are a draft and may change once your institution confirms them.</p>
                    ) : null}
                    <ol className="mt-4 grid gap-3">
                      {steps.map((st) => (
                        <li key={st.key} className="flex gap-3 rounded-xl bg-canvas p-3.5">
                          <span className={cx("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", st.done ? "bg-brand text-white" : "border-2 border-line-strong bg-paper")}>
                            {st.done ? <CheckCircle2 aria-hidden="true" className="size-4" /> : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                              <p className="text-[14px] font-semibold text-fg">{st.title}</p>
                              <p className="tabular text-[12.5px] font-medium text-muted">{st.note}</p>
                            </div>
                            {st.body}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })
            ) : (
              <Panel title="Requirements">
                <p className="text-[13px] text-muted">Your institution has not activated a service policy yet, so no target is shown.</p>
              </Panel>
            )}
            {d.campProgress.length ? (
              <Panel title="Camp attendance" description="Days with a verified camp credit.">
                <ul className="grid gap-3">
                  {d.campProgress.map((c) => (
                    <li key={c.event}>
                      <p className="font-medium text-fg">
                        {c.title}: {c.daysCredited} day{c.daysCredited === 1 ? "" : "s"} credited
                      </p>
                      {c.missingDays.length ? <p className="text-[13px] text-muted">Missing: {c.missingDays.map((x) => formatDate(x)).join(", ")}</p> : <p className="text-[13px] text-muted">No missing days.</p>}
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </div>

          {certs.data?.length ? (
            <Panel title="Completion certificates" className="mb-6">
              <ul className="grid gap-2">
                {certs.data.map((c) => (
                  <li key={c._id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[14px]">
                      {c.policyName} v{c.policyVersion} · <span className="font-mono text-[13px]">{c.certId}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StateBadge state={c.status} />
                      <Button size="sm" variant="ghost" onClick={() => openPdf(api, `/api/ops/certificates/${c._id}/pdf`).catch((e) => toast.error(errorMessage(e)))}>
                        PDF
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Tabs id={tabsId} label="Passbook sections" value={tab} onChange={setTab} tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))} className="mb-4 print:hidden" />
          <div {...tabPanelProps(tabsId, tab)}>
            <Panel padded={false}>
              {tab === "ledger" ? (
                d.entries.length ? (
                  <ul>
                    {d.entries.map((e) => (
                      <li key={e._id} className="flex flex-col gap-1 border-b border-line px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-fg">
                            {formatMinutes(e.minutes)} · {e.kind === "camp" ? "Camp" : "Regular"} · {e.category}
                          </p>
                          <p className="text-[13px] text-muted">
                            {formatDate(e.serviceDate)} · {e.entryType}
                            {e.policyVersion ? ` · policy v${e.policyVersion}` : ""}
                            {e.reason ? ` · ${e.reason}` : ""}
                          </p>
                        </div>
                        {e.entryType === "credit" ? (
                          <Button size="sm" variant="ghost" icon={MessageSquareWarning} onClick={() => setComplaint({ ledgerEntry: e._id })} className="print:hidden">
                            Dispute
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={NotebookPen} title="No verified service yet" description="Write a diary entry for an activity you attended; it counts once a supervisor approves it." />
                )
              ) : tab === "complaints" ? (
                comp.data?.length ? (
                  <ul>
                    {comp.data.map((g) => (
                      <li key={g._id} className="border-b border-line px-5 py-3 last:border-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-fg">
                            {GRIEVANCE_LABEL[g.type]}
                            {g.event?.title ? ` — ${g.event.title}` : ""}
                          </p>
                          <StateBadge state={g.status} />
                        </div>
                        <ol className="mt-2 grid gap-1 text-[13px] text-fg-2">
                          {g.history.map((h, i) => (
                            <li key={i}>
                              {formatDate(h.at)} · {h.action}: {h.note}
                            </li>
                          ))}
                        </ol>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={MessageSquareWarning} title="No complaints" description="If hours or attendance are missing, raise a complaint from a record." />
                )
              ) : d[tab]?.length ? (
                <ul>
                  {d[tab].map((e) =>
                    row(
                      e,
                      tab === "returned" || tab === "drafts" ? (
                        <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                          {tab === "returned" ? "Correct" : "Edit"}
                        </Button>
                      ) : tab === "rejected" ? (
                        <Button size="sm" variant="ghost" onClick={() => setComplaint({ diary: e._id })}>
                          Dispute
                        </Button>
                      ) : null
                    )
                  )}
                </ul>
              ) : (
                <EmptyState icon={NotebookPen} title="Nothing here" description="No entries in this state." />
              )}
            </Panel>
          </div>
        </>
      )}

      <DiaryForm open={Boolean(editing)} entry={editing === "new" ? null : editing} activities={acts.data || []} onClose={() => setEditing(null)} onSaved={pb.reload} />
      <ComplaintForm open={Boolean(complaint)} target={complaint || {}} onClose={() => setComplaint(null)} onSaved={reloadAll} />
    </>
  );
}
