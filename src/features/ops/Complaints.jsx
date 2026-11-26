"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { MessageSquareWarning } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { GRIEVANCE_LABEL, StateBadge } from "./shared";

const TABS = [
  { id: "open", label: "Open" },
  { id: "under_review", label: "Under review" },
  { id: "escalated", label: "Escalated" },
  { id: "upheld", label: "Upheld" },
  { id: "dismissed", label: "Dismissed" },
];

function Respond({ g, onClose, onDone }) {
  const [action, setAction] = useState("review");
  const [note, setNote] = useState("");
  const [minutes, setMinutes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const go = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/ops/grievances/${g._id}/respond`, { action, note, minutesAdjustment: action === "uphold" && minutes ? Number(minutes) : undefined });
      toast.success("Response recorded; the volunteer can see it.");
      setNote("");
      setMinutes("");
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
      open={Boolean(g)}
      onClose={busy ? () => {} : onClose}
      title="Respond to complaint"
      description={g ? `${g.student?.name} · ${GRIEVANCE_LABEL[g.type]}` : ""}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" onClick={go} loading={busy}>
            Record response
          </Button>
        </>
      }
    >
      {g ? (
        <div className="grid gap-4 text-[14px]">
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-canvas p-3 text-[13px]">{g.explanation}</p>
          <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-1 text-[13px] font-semibold">Action</legend>
            {[
              ["review", "Start review"],
              ["escalate", "Escalate"],
              ["uphold", "Uphold"],
              ["dismiss", "Dismiss"],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="gaction" checked={action === v} onChange={() => setAction(v)} />
                {l}
              </label>
            ))}
          </fieldset>
          {action === "uphold" ? (
            <Input label="Correction in minutes (optional)" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} hint="Positive adds service, negative removes it. Recorded as a separate ledger adjustment linked to this complaint." />
          ) : null}
          <Textarea label="Note to the volunteer (required)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
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

export default function Complaints() {
  const tabsId = useId();
  const [tab, setTab] = useState("open");
  const [open, setOpen] = useState(null);
  const q = useResource(() => api.get("/api/ops/grievances", { params: { status: tab } }).then((r) => r.data.grievances), [tab]);
  return (
    <>
      <PageHeader eyebrow="Service" title="Hours complaints" description="Resolving a complaint never edits credits directly; an upheld correction is written as a linked ledger adjustment." />
      <Tabs id={tabsId} label="Complaint status" value={tab} onChange={setTab} tabs={TABS} className="mb-4" />
      <div {...tabPanelProps(tabsId, tab)}>
        {q.status === "error" ? (
          <ErrorState error={q.error} onRetry={q.reload} />
        ) : !q.data ? (
          <TableSkeleton />
        ) : q.data.length ? (
          <Panel padded={false}>
            <ul>
              {q.data.map((g) => (
                <li key={g._id} className="border-b border-line px-5 py-3 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-fg">
                        {g.student?.name} — {GRIEVANCE_LABEL[g.type]}
                        {g.event?.title ? ` · ${g.event.title}` : ""}
                      </p>
                      <p className="text-[13px] text-muted">Raised {formatDate(g.createdAt)} · window closes {formatDate(g.deadline)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StateBadge state={g.status} />
                      {["open", "under_review", "escalated"].includes(g.status) ? (
                        <Button size="sm" variant="dark" onClick={() => setOpen(g)}>
                          Respond
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <ol className="mt-2 grid gap-0.5 text-[13px] text-fg-2">
                    {g.history.map((h, i) => (
                      <li key={i}>
                        {formatDate(h.at)} · {h.action}: {h.note}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </Panel>
        ) : (
          <EmptyState icon={MessageSquareWarning} title="No complaints here" />
        )}
      </div>
      <Respond g={open} onClose={() => setOpen(null)} onDone={q.reload} />
    </>
  );
}
