"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { TableSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { openPdf } from "./shared";

const ay = () => (new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1);
const PRESETS = {
  annual: () => [`${ay()}-06-01`, `${ay() + 1}-06-01`],
  month: () => {
    const d = new Date();
    return [new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10), new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10)];
  },
  quarter: () => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3) * 3;
    return [new Date(d.getFullYear(), q, 1).toISOString().slice(0, 10), new Date(d.getFullYear(), q + 3, 1).toISOString().slice(0, 10)];
  },
};

async function download(url, name) {
  const r = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

function Templates({ types }) {
  const list = useResource(() => api.get("/api/ops/reports/templates").then((r) => r.data.templates), []);
  const [f, setF] = useState({ type: "service_summary", title: "", signatories: "Programme Officer\nPrincipal / Head of Institution", footerNote: "", changeReason: "" });
  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <Panel title="Report templates" description="Title and signatories per report, versioned. Without an active template a built-in default is used and labelled as a draft template requiring institutional review." className="mt-4">
      <ul className="mb-3 grid gap-1 text-[13px]">
        {(list.data || []).map((t) => (
          <li key={t._id} className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {t.title} · v{t.version} · {t.signatories.join(", ")} · <span className="text-muted">{t.changeReason}</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge tone={t.status === "active" ? "success" : "neutral"}>{t.status}</Badge>
              {t.status === "draft" ? (
                <Button size="sm" variant="ghost" onClick={() => act(() => api.post(`/api/ops/reports/templates/${t._id}/activate`), "Template activated")}>
                  Activate
                </Button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select label="Report" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <label className="grid gap-1 text-[13px] font-medium">
          Signatories (one per line)
          <textarea className="min-h-20 rounded-lg border border-line bg-paper p-2 font-normal" value={f.signatories} onChange={(e) => setF({ ...f, signatories: e.target.value })} />
        </label>
        <Input label="Reason for this version" value={f.changeReason} onChange={(e) => setF({ ...f, changeReason: e.target.value })} />
        <Button variant="outline" onClick={() => act(() => api.post("/api/ops/reports/templates", { ...f, signatories: f.signatories.split("\n").map((x) => x.trim()).filter(Boolean) }), "Template version saved as draft")}>
          Save template version
        </Button>
      </div>
    </Panel>
  );
}

export default function Reports() {
  const types = useResource(() => api.get("/api/ops/reports/types").then((r) => r.data.types), []);
  const units = useResource(() => api.get("/api/ops/units").then((r) => r.data.units), []);
  const list = useResource(() => api.get("/api/ops/reports").then((r) => r.data.reports), []);
  const [f, setF] = useState({ type: "service_summary", from: PRESETS.annual()[0], to: PRESETS.annual()[1], unit: "" });
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(null);
  const gen = async () => {
    setBusy(true);
    try {
      await api.post("/api/ops/reports", { ...f, unit: f.unit || undefined });
      toast.success("Draft report generated");
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const act = async (fn, msg) => {
    try {
      await fn();
      if (msg) toast.success(msg);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const labels = new Map((types.data || []).map((t) => [t.id, t.label]));
  return (
    <>
      <PageHeader eyebrow="Reports" title="Reports" description="Generated from approved records into a fixed snapshot. Each report stays a draft until another Programme Officer approves it, and shows its institution, unit, period, policy version, generation time and signatory lines." />
      <Panel title="Generate a report" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-5 sm:items-end">
          <Select label="Report" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} containerClassName="sm:col-span-2">
            {(types.data || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
          <Input label="From" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <Input label="To (exclusive)" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
          <Select label="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>
            <option value="">All units</option>
            {(units.data || []).map((u) => (
              <option key={u._id} value={u._id}>
                {u.code}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2 sm:col-span-4">
            {Object.keys(PRESETS).map((p) => (
              <Button key={p} size="sm" variant="ghost" onClick={() => { const [from, to] = PRESETS[p](); setF({ ...f, from, to }); }}>
                This {p === "annual" ? "academic year" : p}
              </Button>
            ))}
          </div>
          <Button variant="dark" loading={busy} onClick={gen}>
            Generate draft
          </Button>
        </div>
      </Panel>
      {list.status === "error" ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <TableSkeleton />
      ) : list.data.length ? (
        <Panel padded={false}>
          <ul>
            {list.data.map((r) => (
              <li key={r._id} className="flex flex-col gap-2 border-b border-line px-5 py-3 text-[13px] last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-medium text-fg">{r.title || labels.get(r.type)}</span>
                  <span className="text-muted">
                    {formatDate(r.period.from)} – {formatDate(r.period.to)} · generated {formatDate(r.generatedAt)} · {r.policy?.name ? `policy v${r.policy.version}` : "no policy"} · template {r.templateVersion ? `v${r.templateVersion}` : "default draft"}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.status === "approved" ? "success" : r.status === "draft" ? "warning" : "neutral"}>{r.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => api.get(`/api/ops/reports/${r._id}`).then((x) => setView(x.data))}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openPdf(api, `/api/ops/reports/${r._id}/pdf`).catch((e) => toast.error(errorMessage(e)))}>
                    PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => download(`/api/ops/reports/${r._id}/csv`, `${r.type}.csv`).catch((e) => toast.error(errorMessage(e)))}>
                    CSV
                  </Button>
                  {r.status === "draft" ? (
                    <Button size="sm" variant="dark" onClick={() => act(() => api.post(`/api/ops/reports/${r._id}/approve`), "Report approved")}>
                      Approve
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState icon={FileBarChart} title="No reports yet" description="Generate a draft above." />
      )}
      <Templates types={types.data || []} />
      <Modal open={Boolean(view)} onClose={() => setView(null)} title={view?.report?.title} description={view ? `${view.report.status.toUpperCase()} · ${view.intact ? "data intact" : "CHECKSUM MISMATCH"}` : ""} size="xl">
        {view ? (
          <div className="grid gap-3 text-[13px]">
            <div className="max-h-[50vh] overflow-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr>
                    {view.report.data.columns.map((c) => (
                      <th key={c} scope="col" className="border-b border-line py-1 pr-2 text-left font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.report.data.rows.map((row, i) => (
                    <tr key={i} className="border-b border-line">
                      {row.map((c, j) => (
                        <td key={j} className="py-1 pr-2 align-top">
                          {c == null ? "" : String(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!view.report.data.rows.length ? <p className="py-2 text-muted">No rows for this period.</p> : null}
            </div>
            <ul>
              {Object.entries(view.report.data.totals || {}).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}</strong>: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </li>
              ))}
            </ul>
            {(view.report.data.notes || []).map((n, i) => (
              <p key={i} className="text-muted">
                {n}
              </p>
            ))}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
