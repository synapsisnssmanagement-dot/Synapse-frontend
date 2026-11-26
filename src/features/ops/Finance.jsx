"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { rupees } from "./campShared";
import { opId } from "./shared";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "entries", label: "Register" },
  { id: "budgets", label: "Budgets" },
  { id: "recon", label: "Reconciliation" },
  { id: "stock", label: "Stock & equipment" },
  { id: "meetings", label: "Committee meetings" },
  { id: "handover", label: "Handover" },
];
const toPaise = (rs) => Math.round(Number(rs || 0) * 100);
const thisYear = () => (new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1);

function useRun(after) {
  const [busy, setBusy] = useState(false);
  return [
    busy,
    async (fn, msg) => {
      setBusy(true);
      try {
        const r = await fn();
        if (msg) toast.success(msg);
        after?.();
        return r;
      } catch (e) {
        toast.error(errorMessage(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
  ];
}

function Summary({ year }) {
  const s = useResource(() => api.get("/api/ops/finance/summary", { params: { academicYear: year } }).then((r) => r.data), [year]);
  const u = useResource(() => api.get("/api/ops/finance/utilisation", { params: { academicYear: year } }).then((r) => r.data), [year]);
  if (s.status === "error") return <ErrorState error={s.error} onRetry={s.reload} />;
  if (!s.data) return <TableSkeleton />;
  const d = s.data;
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Grants received" value={rupees(d.grantsPaise)} />
        <StatCard label="Expenses" value={rupees(d.expensesPaise)} />
        <StatCard label="Register balance" value={rupees(d.registerBalancePaise)} footnote="Grants − expenses − advances + returns" />
        <StatCard label="Online donations" value={rupees(d.donations.amountPaise)} footnote={`${d.donations.count} payments (shown separately)`} />
      </div>
      {d.unverifiedEntries ? <p className="text-[13px] text-amber-700">{d.unverifiedEntries} register entries are not yet verified by a second officer.</p> : null}
      <Panel title="Budget vs actual">
        <ul className="grid gap-1 text-[13px]">
          {d.budgetVsActual.map((b) => (
            <li key={b.head} className="flex justify-between gap-2">
              <span>{b.head}</span>
              <span className="tabular">
                {rupees(b.spentPaise)} of {rupees(b.budgetPaise)}
              </span>
            </li>
          ))}
          {!d.budgetVsActual.length ? <li className="text-muted">No budgets or expenses this year.</li> : null}
        </ul>
      </Panel>
      <Panel title="Advances outstanding">
        <ul className="grid gap-1 text-[13px]">
          {d.advancesOutstanding.map((a) => (
            <li key={a._id}>
              {formatDate(a.date)} · {a.description}: {rupees(a.outstandingPaise)} outstanding
            </li>
          ))}
          {!d.advancesOutstanding.length ? <li className="text-muted">None.</li> : null}
        </ul>
      </Panel>
      {u.data ? (
        <Panel title="Utilisation statement (draft)" description={u.data.status}>
          <p className="text-[13px]">
            Received {rupees(u.data.totalReceivedPaise)} · spent {rupees(u.data.totalExpenditurePaise)} · unspent {rupees(u.data.unspentPaise)}
          </p>
          <ul className="mt-2 grid gap-1 text-[13px]">
            {Object.entries(u.data.expenditureByHead).map(([h, v]) => (
              <li key={h}>
                {h}: {rupees(v)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12.5px] text-muted">Signatories: {u.data.signatories.join(", ")}. Produce the final statement in your institution&apos;s required format after review.</p>
        </Panel>
      ) : null}
    </div>
  );
}

function Entries() {
  const list = useResource(() => api.get("/api/ops/finance/entries").then((r) => r.data.entries), []);
  const teachers = useResource(() => getList("/api/coordinator/teachers", "teachers"), []);
  const [busy, run] = useRun(list.reload);
  const [f, setF] = useState({ kind: "expense", amount: "", date: "", head: "general", description: "", mode: "bank", source: "", reference: "", holder: "", advance: "", op: opId() });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const reversed = new Set((list.data || []).filter((e) => e.kind === "reversal").map((e) => String(e.reverses)));
  const advances = (list.data || []).filter((e) => e.kind === "advance" && !reversed.has(String(e._id)));
  const save = () =>
    run(() => api.post("/api/ops/finance/entries", { opId: f.op, kind: f.kind, amountPaise: toPaise(f.amount), date: f.date || undefined, head: f.head, description: f.description, mode: f.mode, source: f.source, reference: f.reference, holder: f.holder || undefined, advance: f.advance || undefined }), "Entry recorded").then((r) => r && setF((x) => ({ ...x, amount: "", description: "", reference: "", op: opId() })));
  return (
    <div className="grid gap-4">
      <Panel title="Record an entry" description="Entries cannot be edited. Correct a mistake with a reversal. Each submission carries an id so a double-click or retry records it once.">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select label="Kind" value={f.kind} onChange={set("kind")}>
            <option value="grant">Grant received</option>
            <option value="advance">Advance issued</option>
            <option value="expense">Expense</option>
            <option value="advance_return">Advance returned</option>
          </Select>
          <Input label="Amount (₹)" type="number" min={0} step="0.01" value={f.amount} onChange={set("amount")} />
          <Input label="Date" type="date" value={f.date} onChange={set("date")} />
          <Input label="Budget head" value={f.head} onChange={set("head")} />
          <Input label="Description" value={f.description} onChange={set("description")} containerClassName="sm:col-span-2" />
          <Select label="Mode" value={f.mode} onChange={set("mode")}>
            {["bank", "cash", "upi", "cheque", "other"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          <Input label={f.kind === "grant" ? "Sanction reference" : "Voucher / receipt no."} value={f.reference} onChange={set("reference")} />
          <Input label={f.kind === "grant" ? "Funding body" : "Payee / source"} value={f.source} onChange={set("source")} />
          {f.kind === "advance" ? (
            <Select label="Advance to" value={f.holder} onChange={set("holder")} placeholder="Choose staff">
              {(teachers.data || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : null}
          {["expense", "advance_return"].includes(f.kind) ? (
            <Select label="Against advance" value={f.advance} onChange={set("advance")}>
              <option value="">{f.kind === "expense" ? "— none —" : "Choose advance"}</option>
              {advances.map((a) => (
                <option key={a._id} value={a._id}>
                  {formatDate(a.date)} {a.description} ({rupees(a.amountPaise)})
                </option>
              ))}
            </Select>
          ) : null}
          <Button variant="dark" onClick={save} loading={busy} className="self-end">
            Record
          </Button>
        </div>
      </Panel>
      <Panel padded={false}>
        {list.status === "error" ? <ErrorState error={list.error} onRetry={list.reload} /> : null}
        <ul>
          {(list.data || []).map((e) => (
            <li key={e._id} className="flex flex-col gap-1 border-b border-line px-5 py-2 text-[13px] last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <span className={reversed.has(String(e._id)) ? "line-through text-muted" : ""}>
                {formatDate(e.date)} · <strong>{e.kind.replace("_", " ")}</strong> · {rupees(e.amountPaise)} · {e.head} · {e.description} {e.reference ? `· ${e.reference}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={e.status === "verified" ? "success" : "warning"}>{e.status}</Badge>
                {e.status === "recorded" ? (
                  <Button size="sm" variant="ghost" onClick={() => run(() => api.post(`/api/ops/finance/entries/${e._id}/verify`), "Verified")}>
                    Verify
                  </Button>
                ) : null}
                {e.kind !== "reversal" && !reversed.has(String(e._id)) ? (
                  <Button size="sm" variant="ghost" onClick={() => { const reason = window.prompt("Reason for reversing this entry:"); if (reason) run(() => api.post("/api/ops/finance/entries", { opId: opId(), kind: "reversal", reverses: e._id, reason }), "Reversed"); }}>
                    Reverse
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Budgets({ year }) {
  const list = useResource(() => api.get("/api/ops/finance/budgets", { params: { academicYear: year } }).then((r) => r.data.budgets), [year]);
  const [busy, run] = useRun(list.reload);
  const [f, setF] = useState({ head: "", amount: "", reason: "" });
  return (
    <Panel title={`Budget ${year}–${String((year + 1) % 100).padStart(2, "0")}`} description="Planned amounts only; spending is recorded in the register.">
      <ul className="mb-3 grid gap-1 text-[13px]">
        {(list.data || []).map((b) => (
          <li key={b._id}>
            {b.head}: {rupees(b.amountPaise)} <span className="text-muted">({b.history.length} revision{b.history.length === 1 ? "" : "s"}; last: {b.history.at(-1)?.reason})</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
        <Input label="Head" value={f.head} onChange={(e) => setF({ ...f, head: e.target.value })} />
        <Input label="Amount (₹)" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        <Input label="Reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        <Button variant="dark" loading={busy} onClick={() => run(() => api.put("/api/ops/finance/budgets", { academicYear: year, head: f.head, amountPaise: toPaise(f.amount), reason: f.reason }), "Budget saved")}>
          Save
        </Button>
      </div>
    </Panel>
  );
}

function Recon() {
  const list = useResource(() => api.get("/api/ops/finance/reconciliations").then((r) => r.data.reconciliations), []);
  const [busy, run] = useRun(list.reload);
  const [f, setF] = useState({ from: "", to: "", opening: "0", statement: "", explanation: "" });
  return (
    <div className="grid gap-4">
      <Panel title="New reconciliation" description="Compares register totals with your bank/cash statement balance. A second officer approves it.">
        <div className="grid gap-2 sm:grid-cols-5 sm:items-end">
          <Input label="From" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <Input label="To (exclusive)" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
          <Input label="Opening balance (₹)" type="number" value={f.opening} onChange={(e) => setF({ ...f, opening: e.target.value })} />
          <Input label="Statement balance (₹)" type="number" value={f.statement} onChange={(e) => setF({ ...f, statement: e.target.value })} />
          <Button variant="dark" loading={busy} onClick={() => run(() => api.post("/api/ops/finance/reconciliations", { from: f.from, to: f.to, openingBalancePaise: toPaise(f.opening), statementBalancePaise: toPaise(f.statement), explanation: f.explanation }), "Reconciliation prepared")}>
            Prepare
          </Button>
          <Textarea label="Explanation of any difference" rows={2} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} containerClassName="sm:col-span-5" />
        </div>
      </Panel>
      <Panel padded={false}>
        <ul>
          {(list.data || []).map((r) => (
            <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-2 text-[13px] last:border-0">
              <span>
                {formatDate(r.from)} – {formatDate(r.to)} · computed {rupees(r.snapshot.computedClosingPaise)} · statement {rupees(r.statementBalancePaise)} · difference <strong>{rupees(r.differencePaise)}</strong>
                {r.explanation ? ` · ${r.explanation}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={r.status === "approved" ? "success" : "warning"}>{r.status}</Badge>
                {r.status === "draft" ? (
                  <Button size="sm" variant="ghost" onClick={() => run(() => api.post(`/api/ops/finance/reconciliations/${r._id}/approve`, {}), "Approved")}>
                    Approve
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Stock() {
  const s = useResource(() => api.get("/api/ops/stock").then((r) => r.data), []);
  const [busy, run] = useRun(s.reload);
  const [item, setItem] = useState({ name: "", kind: "consumable", unit: "nos" });
  const [mv, setMv] = useState({ item: "", type: "receive", quantity: "", holderName: "", issue: "", reason: "", reference: "" });
  const sel = (s.data?.items || []).find((i) => i._id === mv.item);
  return (
    <div className="grid gap-4">
      <Panel title="Items">
        <ul className="mb-3 grid gap-1 text-[13px]">
          {(s.data?.items || []).map((i) => (
            <li key={i._id}>
              {i.name} ({i.kind}): {i.quantity} {i.unit}
              {i.kind === "equipment" ? ` · ${i.issuedOut} issued out · ${i.quantity - i.issuedOut} on hand` : ""}
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
          <Input label="New item" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} />
          <Select label="Kind" value={item.kind} onChange={(e) => setItem({ ...item, kind: e.target.value })}>
            <option value="consumable">Consumable</option>
            <option value="equipment">Equipment</option>
          </Select>
          <Input label="Unit" value={item.unit} onChange={(e) => setItem({ ...item, unit: e.target.value })} />
          <Button variant="outline" loading={busy} onClick={() => run(() => api.post("/api/ops/stock/items", item), "Item added")}>
            Add item
          </Button>
        </div>
      </Panel>
      <Panel title="Record movement">
        <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
          <Select label="Item" value={mv.item} onChange={(e) => setMv({ ...mv, item: e.target.value })} placeholder="Choose item">
            {(s.data?.items || []).map((i) => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </Select>
          <Select label="Movement" value={mv.type} onChange={(e) => setMv({ ...mv, type: e.target.value })}>
            {(sel?.kind === "equipment" ? ["receive", "issue", "return", "write_off"] : ["receive", "consume", "write_off"]).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Input label="Quantity" type="number" min={0} value={mv.quantity} onChange={(e) => setMv({ ...mv, quantity: e.target.value })} />
          {mv.type === "issue" ? <Input label="Issued to" value={mv.holderName} onChange={(e) => setMv({ ...mv, holderName: e.target.value })} /> : null}
          {mv.type === "return" ? (
            <Select label="Issue being returned" value={mv.issue} onChange={(e) => setMv({ ...mv, issue: e.target.value })} placeholder="Choose">
              {(s.data?.outstandingIssues || []).filter((i) => String(i.item?._id) === mv.item).map((i) => (
                <option key={i._id} value={i._id}>
                  {i.holderName} · {i.outstanding} out
                </option>
              ))}
            </Select>
          ) : null}
          {mv.type === "write_off" ? <Input label="Reason" value={mv.reason} onChange={(e) => setMv({ ...mv, reason: e.target.value })} /> : null}
          <Input label="Reference" value={mv.reference} onChange={(e) => setMv({ ...mv, reference: e.target.value })} />
          <Button variant="dark" loading={busy} disabled={!mv.item} onClick={() => run(() => api.post("/api/ops/stock/movements", { ...mv, quantity: Number(mv.quantity), opId: opId(), issue: mv.issue || undefined }), "Movement recorded")}>
            Record
          </Button>
        </div>
      </Panel>
      <Panel title="Equipment currently issued">
        <ul className="grid gap-1 text-[13px]">
          {(s.data?.outstandingIssues || []).map((i) => (
            <li key={i._id}>
              {i.item?.name} × {i.outstanding} with {i.holderName} since {formatDate(i.createdAt)}
              {i.dueBack ? ` · due ${formatDate(i.dueBack)}` : ""}
            </li>
          ))}
          {s.data && !s.data.outstandingIssues.length ? <li className="text-muted">Nothing issued.</li> : null}
        </ul>
      </Panel>
    </div>
  );
}

function Meetings() {
  const list = useResource(() => api.get("/api/ops/meetings").then((r) => r.data.meetings), []);
  const [busy, run] = useRun(list.reload);
  const [f, setF] = useState({ date: "", attendees: "", agenda: "", minutes: "", actions: "" });
  return (
    <div className="grid gap-4">
      <Panel title="Record a meeting">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <Input label="Attendees (name – role, comma-separated)" value={f.attendees} onChange={(e) => setF({ ...f, attendees: e.target.value })} />
          <Textarea label="Agenda" rows={2} value={f.agenda} onChange={(e) => setF({ ...f, agenda: e.target.value })} />
          <Textarea label="Minutes" rows={2} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} />
          <Textarea label="Action items (one per line)" rows={2} value={f.actions} onChange={(e) => setF({ ...f, actions: e.target.value })} />
          <Button
            variant="dark"
            className="self-end"
            loading={busy}
            onClick={() =>
              run(
                () =>
                  api.post("/api/ops/meetings", {
                    date: f.date,
                    agenda: f.agenda,
                    minutes: f.minutes,
                    attendees: f.attendees.split(",").map((a) => { const [name, role] = a.split("–").map((x) => x.trim()); return { name, role: role || "" }; }).filter((a) => a.name),
                    actionItems: f.actions.split("\n").map((t) => t.trim()).filter(Boolean).map((task) => ({ task })),
                  }),
                "Meeting saved as draft"
              )
            }
          >
            Save draft
          </Button>
        </div>
      </Panel>
      <Panel padded={false}>
        <ul>
          {(list.data || []).map((m) => (
            <li key={m._id} className="border-b border-line px-5 py-3 text-[13px] last:border-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{formatDate(m.date)} · {m.kind.replace("_", " ")}</strong>
                <span className="flex items-center gap-2">
                  <Badge tone={m.status === "approved" ? "success" : "warning"}>{m.status}</Badge>
                  {m.status === "draft" ? (
                    <Button size="sm" variant="ghost" onClick={() => run(() => api.post(`/api/ops/meetings/${m._id}/approve`), "Minutes approved and locked")}>
                      Approve minutes
                    </Button>
                  ) : null}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{m.minutes || "No minutes yet."}</p>
              <ul className="mt-1">
                {m.actionItems.map((a, i) => (
                  <li key={i}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={a.status === "done"} onChange={() => run(() => api.patch(`/api/ops/meetings/${m._id}`, { actionItems: m.actionItems.map((x, j) => ({ ...x, status: j === i ? (x.status === "done" ? "open" : "done") : x.status })) }), "Updated")} />
                      {a.task}
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Handover() {
  const list = useResource(() => api.get("/api/ops/handovers").then((r) => r.data.handovers), []);
  const officers = useResource(() => api.get("/api/ops/officers").then((r) => r.data.officers).catch(() => []), []);
  const [busy, run] = useRun(list.reload);
  const [f, setF] = useState({ toOfficer: "", effectiveDate: "", notes: "", checklist: "Keys and cupboard\nCash book and vouchers\nStock register\nPending complaints briefed" });
  return (
    <div className="grid gap-4">
      <Panel title="Prepare a handover" description="A snapshot of everything pending is captured automatically; the incoming officer acknowledges it.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Select label="Incoming Programme Officer" value={f.toOfficer} onChange={(e) => setF({ ...f, toOfficer: e.target.value })} placeholder="Choose">
            {(officers.data || []).map((o) => (
              <option key={o._id} value={o._id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Input label="Effective date" type="date" value={f.effectiveDate} onChange={(e) => setF({ ...f, effectiveDate: e.target.value })} />
          <Textarea label="Notes" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <Textarea label="Checklist (one per line)" rows={3} value={f.checklist} onChange={(e) => setF({ ...f, checklist: e.target.value })} />
          <Button variant="dark" loading={busy} onClick={() => run(() => api.post("/api/ops/handovers", { ...f, checklist: f.checklist.split("\n").map((x) => x.trim()).filter(Boolean) }), "Handover prepared")}>
            Prepare handover
          </Button>
        </div>
      </Panel>
      {(list.data || []).map((h) => (
        <Panel key={h._id} title={`${h.fromOfficer?.name} → ${h.toOfficer?.name}`} description={`Effective ${formatDate(h.effectiveDate)} · ${h.status}`} actions={h.status === "prepared" ? <Button size="sm" variant="dark" onClick={() => run(() => api.post(`/api/ops/handovers/${h._id}/acknowledge`, {}), "Acknowledged")}>Acknowledge (incoming officer)</Button> : null}>
          <ul className="grid gap-0.5 text-[13px]">
            <li>Diaries awaiting review: {h.snapshot.diariesAwaitingReview} · returned: {h.snapshot.diariesReturned}</li>
            <li>Open complaints: {h.snapshot.openComplaints} · attendance awaiting verification: {h.snapshot.attendanceAwaitingVerification}</li>
            <li>Certificates awaiting review: {h.snapshot.certificatesAwaitingReview} · draft reconciliations: {h.snapshot.draftReconciliations}</li>
            <li>Outstanding advances: {h.snapshot.outstandingAdvances.map((a) => `${a.description} ${rupees(a.outstandingPaise)}`).join("; ") || "none"}</li>
            <li>Equipment out: {h.snapshot.equipmentOut.map((e) => `${e.item} ×${e.outstanding} (${e.holder})`).join("; ") || "none"}</li>
            <li>Open follow-ups: {h.snapshot.openFollowUps.length} · open meeting actions: {h.snapshot.openMeetingActions.length} · camps active: {h.snapshot.campsInProgress.length}</li>
          </ul>
          {h.notes ? <p className="mt-2 whitespace-pre-wrap text-[13px]">{h.notes}</p> : null}
        </Panel>
      ))}
    </div>
  );
}

export default function Finance() {
  const tabsId = useId();
  const [tab, setTab] = useState("summary");
  const [year, setYear] = useState(thisYear());
  return (
    <>
      <PageHeader
        eyebrow="Finance & registers"
        title="Finance and registers"
        description="Operational records for review by your institution's accounts office. Grants, advances, expenses, budgets and online donations are kept separate. This does not establish accounting or legal compliance, and no funding rates are assumed."
        actions={<Input label="Academic year (start)" type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || thisYear())} containerClassName="w-40" />}
      />
      <Tabs id={tabsId} label="Finance sections" value={tab} onChange={setTab} tabs={TABS} className="mb-4" />
      <div {...tabPanelProps(tabsId, tab)}>
        {tab === "summary" ? <Summary year={year} /> : tab === "entries" ? <Entries /> : tab === "budgets" ? <Budgets year={year} /> : tab === "recon" ? <Recon /> : tab === "stock" ? <Stock /> : tab === "meetings" ? <Meetings /> : <Handover />}
      </div>
    </>
  );
}
