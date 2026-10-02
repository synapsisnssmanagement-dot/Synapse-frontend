"use client";

import { useId, useMemo, useState } from "react";
import { Award, CheckCircle2, Clock3, Download, Tent, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatNumber, photoOf } from "@/lib/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "behind", label: "Behind pace" },
  { id: "camp", label: "Needs a camp" },
  { id: "eligible", label: "Eligible" },
];

function HoursBar({ value, target }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="min-w-32">
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="tabular font-semibold text-fg">{formatNumber(Math.round(value))}</span>
        <span className="text-subtle">/ {target}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.round(value)}>
        <div className={pct >= 100 ? "h-full rounded-full bg-brand" : "h-full rounded-full bg-ink/70"} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Eligibility() {
  const tabsId = useId();
  const data = useResource(() => api.get("/api/nss/eligibility").then((res) => res.data), []);
  const [filter, setFilter] = useState("all");

  const rules = data.data?.rules || { targetHours: 240, yearlyHours: 120 };
  const all = useMemo(() => data.data?.volunteers || [], [data.data]);
  const counts = useMemo(
    () => ({
      all: all.length,
      behind: all.filter((v) => v.behindPace).length,
      camp: all.filter((v) => !v.campDone).length,
      eligible: all.filter((v) => v.eligible).length,
    }),
    [all]
  );
  const rows = all.filter((v) => (filter === "behind" ? v.behindPace : filter === "camp" ? !v.campDone : filter === "eligible" ? v.eligible : true));

  const exportCsv = () =>
    downloadCsv("nss-certificate-eligibility.csv", [
      ["name", "email", "department", "total hours", `hours ${data.data?.currentYear || "this year"}`, "special camp", "eligible", "behind pace"],
      ...all.map((v) => [v.name, v.email, v.department || "", v.total, v.currentYear, v.campDone ? "yes" : "no", v.eligible ? "yes" : "no", v.behindPace ? "yes" : "no"]),
    ]);

  const columns = [
    { key: "name", header: "Volunteer", sortable: true, primary: true, render: (r) => <Identity name={r.name} email={r.department || r.email} src={photoOf(r)} /> },
    { key: "total", header: "NSS hours", sortable: true, render: (r) => <HoursBar value={r.total} target={rules.targetHours} /> },
    {
      key: "currentYear",
      header: `This year (${data.data?.currentYear || ""})`,
      sortable: true,
      render: (r) => (
        <span className="tabular whitespace-nowrap">
          <span className="font-semibold text-fg">{formatNumber(Math.round(r.currentYear))}</span>
          <span className="text-subtle"> / {rules.yearlyHours}</span>
        </span>
      ),
    },
    {
      key: "campDone",
      header: "Special camp",
      sortable: true,
      sortValue: (r) => (r.campDone ? 1 : 0),
      render: (r) =>
        r.campDone ? (
          <Badge tone="success" icon={CheckCircle2}>
            Done
          </Badge>
        ) : (
          <Badge tone="neutral" icon={Tent}>
            Not yet
          </Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => (r.eligible ? 2 : r.behindPace ? 0 : 1),
      render: (r) =>
        r.eligible ? (
          <Badge tone="success" icon={Award}>
            Eligible
          </Badge>
        ) : r.behindPace ? (
          <Badge tone="warning" icon={TriangleAlert}>
            Behind pace
          </Badge>
        ) : (
          <Badge tone="info" icon={Clock3}>
            On track
          </Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Recognition"
        title="NSS certificates"
        description={`The NSS certificate needs ${rules.targetHours} hours over two years (${rules.yearlyHours} a year) and one special camp. Hours here are counted from attendance, so they always match the record.`}
        actions={
          <Button variant="outline" icon={Download} onClick={exportCsv} disabled={!all.length}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Volunteers" value={counts.all} icon={Users} />
        <StatCard label="Eligible" value={counts.eligible} icon={Award} variant="mint" />
        <StatCard label="Behind pace" value={counts.behind} icon={TriangleAlert} footnote="Under ¾ of the hours expected by now" />
        <StatCard label="Need a camp" value={counts.camp} icon={Tent} />
      </div>

      <Tabs id={tabsId} label="Filter volunteers" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} className="mb-5" />
      <div {...tabPanelProps(tabsId, filter)}>
        <DataTable
          caption="NSS certificate progress"
          columns={columns}
          rows={rows}
          loading={data.loading}
          error={data.status === "error" ? data.error : null}
          onRetry={data.reload}
          searchKeys={["name", "email", "department"]}
          searchPlaceholder="Search volunteers"
          initialSort={{ key: "total", dir: "desc" }}
          noun="volunteers"
          empty={{
            icon: Award,
            title: filter === "all" ? "No volunteers yet" : "Nobody here",
            description: filter === "all" ? "Volunteers appear here once students join the NSS unit." : "No volunteer matches this filter right now.",
          }}
        />
      </div>
    </>
  );
}
