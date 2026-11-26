"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/DataTable";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { StateBadge, formatMinutes, opId } from "./shared";

const TABS = [
  { id: "submitted", label: "Awaiting review" },
  { id: "returned", label: "Returned" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

// Each decision is made and recorded one entry at a time, so every credit
// stays traceable to a named reviewer and reason.
function Decide({ entry, onClose, onDone }) {
  const [action, setAction] = useState("approve");
  const [minutes, setMinutes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seen, setSeen] = useState(null);
  if (entry && seen !== entry._id) {
    setSeen(entry._id);
    setAction("approve");
    setMinutes(String(entry.claimedMinutes));
    setReason("");
    setError("");
  }
  const reduced = action === "approve" && Number(minutes) < (entry?.claimedMinutes || 0);
  const needsReason = action !== "approve" || reduced;
  const go = async () => {
    setError("");
    if (needsReason && reason.trim().length < 3) return setError(action === "approve" ? "Explain why fewer minutes are approved." : "Give the volunteer a reason.");
    setBusy(true);
    try {
      await api.post(`/api/ops/diary/${entry._id}/decide`, { action, approvedMinutes: action === "approve" ? Number(minutes) : undefined, reason, rev: entry.rev });
      toast.success(action === "approve" ? "Approved — one ledger credit recorded" : action === "return" ? "Returned to the volunteer" : "Rejected");
      onDone();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={Boolean(entry)}
      onClose={busy ? () => {} : onClose}
      title="Review diary entry"
      description={entry ? `${entry.student?.name} · ${entry.event?.title || entry.externalOrganisation || "External service"} · ${formatDate(entry.serviceDate)}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={action === "reject" ? "danger" : "dark"} onClick={go} loading={busy}>
            {action === "approve" ? "Approve" : action === "return" ? "Return for changes" : "Reject"}
          </Button>
        </>
      }
    >
      {entry ? (
        <div className="grid gap-4 text-[14px]">
          <dl className="grid gap-2 rounded-lg border border-line bg-canvas p-3 text-[13px]">
            <div>
              <dt className="font-semibold">Claimed</dt>
              <dd>{formatMinutes(entry.claimedMinutes)} · {entry.kind} · {entry.category}</dd>
            </div>
            <div>
              <dt className="font-semibold">Attendance check</dt>
              <dd>{entry.attendanceCheck?.note || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Work performed</dt>
              <dd className="whitespace-pre-wrap">{entry.workDone}</dd>
            </div>
            {entry.reflection ? (
              <div>
                <dt className="font-semibold">Reflection</dt>
                <dd className="whitespace-pre-wrap">{entry.reflection}</dd>
              </div>
            ) : null}
            {entry.revisions?.length > 1 ? (
              <div>
                <dt className="font-semibold">History</dt>
                <dd>
                  Submitted {entry.revisions.length} times. Earlier decisions: {entry.decisions.map((x) => `${x.action} (${x.reason || "no reason"})`).join("; ")}
                </dd>
              </div>
            ) : null}
          </dl>
          <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-1 text-[13px] font-semibold">Decision</legend>
            {[
              ["approve", "Approve"],
              ["return", "Return for changes"],
              ["reject", "Reject"],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="decision" value={v} checked={action === v} onChange={() => setAction(v)} />
                {l}
              </label>
            ))}
          </fieldset>
          {action === "approve" ? (
            <Input label="Approved minutes" type="number" min={1} max={entry.claimedMinutes} value={minutes} onChange={(e) => setMinutes(e.target.value)} hint={`Up to ${entry.claimedMinutes} claimed`} />
          ) : null}
          <Textarea label={needsReason ? "Reason (required)" : "Note (optional)"} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          {error ? (
            <p role="alert" className="text-[13px] font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function Adjust({ entry, onClose, onDone }) {
  const [minutes, setMinutes] = useState("");
  const [reason, setReason] = useState("");
  const [reverse, setReverse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [op] = useState(opId);
  if (!entry) return null;
  const go = async () => {
    setBusy(true);
    try {
      await api.post(`/api/ops/ledger/${entry.ledgerEntry}/adjust`, reverse ? { reverse: true, reason } : { minutes: Number(minutes), reason, opId: op });
      toast.success(reverse ? "Credit reversed (recorded as a separate entry)" : "Adjustment recorded");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={busy ? () => {} : onClose} title="Correct an approved credit" description="The original approval is kept. The correction is a separate, signed ledger entry with your reason." footer={<Button variant={reverse ? "danger" : "dark"} onClick={go} loading={busy}>{reverse ? "Reverse credit" : "Record adjustment"}</Button>}>
      <div className="grid gap-3">
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} /> Reverse the whole remaining credit
        </label>
        {!reverse ? <Input label="Change in minutes (+ adds, − removes)" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} /> : null}
        <Textarea label="Reason (required)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}

export default function DiaryReview({ role = "coordinator" }) {
  const [picked, setPicked] = useState(new Set());
  const [adjust, setAdjust] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const tabsId = useId();
  const [tab, setTab] = useState("submitted");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const q = useResource(() => api.get("/api/ops/diary/review", { params: { status: tab, page } }).then((r) => r.data), [tab, page]);
  const entries = q.data?.entries || [];
  const ids = entries.filter((e) => e.status === "submitted").map((e) => e._id).join(",");
  const flags = useResource(() => (ids ? api.get("/api/ops/diary/flags", { params: { ids } }).then((r) => r.data.flags) : Promise.resolve({})), [ids]);
  const bulk = async () => {
    setBulkBusy(true);
    try {
      const items = entries.filter((e) => picked.has(e._id)).map((e) => ({ id: e._id, rev: e.rev }));
      const r = await api.post("/api/ops/diary/bulk-approve", { items });
      const ok = r.data.results.filter((x) => x.state === "approved").length;
      const skipped = r.data.results.filter((x) => x.state !== "approved").length;
      toast.success(`${ok} approved individually${skipped ? `; ${skipped} skipped for individual review` : ""}`);
      setPicked(new Set());
      q.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBulkBusy(false);
    }
  };
  return (
    <>
      <PageHeader eyebrow="Service" title="Diary review" description="Approve the time each volunteer actually served. Teachers see only activities they supervise. Reductions, returns and rejections need a reason." />
      <Tabs
        id={tabsId}
        label="Review status"
        value={tab}
        onChange={(v) => {
          setTab(v);
          setPage(1);
          setPicked(new Set());
        }}
        tabs={TABS}
        className="mb-4"
      />
      <div {...tabPanelProps(tabsId, tab)}>
        {q.status === "error" ? (
          <ErrorState error={q.error} onRetry={q.reload} />
        ) : q.status === "loading" && !q.data ? (
          <TableSkeleton />
        ) : entries.length ? (
          <Panel
            padded={false}
            actions={
              tab === "submitted" ? (
                <Button size="sm" variant="dark" disabled={!picked.size} loading={bulkBusy} onClick={bulk}>
                  Approve {picked.size || ""} selected at claimed time
                </Button>
              ) : null
            }
            title={tab === "submitted" ? "Entries" : undefined}
            description={tab === "submitted" ? "Bulk approval records each decision separately. Flagged entries are skipped and must be reviewed one by one." : undefined}
          >
            <ul>
              {entries.map((e) => (
                <li key={e._id} className="flex flex-col gap-2 border-b border-line px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  {e.status === "submitted" ? (
                    <input
                      type="checkbox"
                      aria-label={`Select ${e.student?.name}'s entry`}
                      className="size-4 shrink-0"
                      disabled={Boolean(flags.data?.[e._id]?.length)}
                      checked={picked.has(e._id)}
                      onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(e._id)) n.delete(e._id); else n.add(e._id); return n; })}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg">
                      {e.student?.name} — {e.event?.title || e.externalOrganisation || "External service"}
                    </p>
                    <p className="text-[13px] text-muted">
                      {formatDate(e.serviceDate)} · {formatMinutes(e.claimedMinutes)} claimed · {e.kind}
                      {e.kind === "external" ? " · needs officer review" : ""}
                    </p>
                    {flags.data?.[e._id]?.length ? <p className="text-[12.5px] font-medium text-amber-700">Review individually: {flags.data[e._id].join("; ")}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StateBadge state={e.status} />
                    {e.status === "submitted" ? (
                      <Button size="sm" variant="dark" onClick={() => setOpen(e)}>
                        Review
                      </Button>
                    ) : null}
                    {e.status === "approved" && e.ledgerEntry && role === "coordinator" ? (
                      <Button size="sm" variant="outline" onClick={() => setAdjust(e)}>
                        Correct credit
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3">
              <Pagination page={page} pageCount={Math.max(1, Math.ceil((q.data?.total || 0) / 50))} total={q.data?.total || 0} pageSize={50} onPage={setPage} noun="entries" />
            </div>
          </Panel>
        ) : (
          <EmptyState icon={ClipboardCheck} title="Nothing to review" description="Entries appear here when volunteers submit them." />
        )}
      </div>
      <Decide entry={open} onClose={() => setOpen(null)} onDone={q.reload} />
      <Adjust entry={adjust} onClose={() => setAdjust(null)} onDone={q.reload} />
    </>
  );
}
