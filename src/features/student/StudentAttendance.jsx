"use client";

import { CalendarCheck } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import useResource from "@/hooks/useResource";
import api, { getList } from "@/lib/api";
import { formatDate } from "@/lib/format";

async function loadAttendance() {
  const events = await getList("/api/students/my-events", "events");
  const records = await Promise.all(
    events.map((event) =>
      api
        .get(`/api/students/event/${event._id}/attendance`)
        .then((res) => res.data?.attendance || null)
        .catch(() => null)
    )
  );
  return events.map((event, i) => ({ ...event, record: records[i] }));
}

export default function StudentAttendance() {
  const list = useResource(loadAttendance, []);
  const rows = list.data || [];
  const present = rows.filter((r) => r.record?.status === "Present").length;
  const absent = rows.filter((r) => r.record?.status === "Absent").length;
  const marked = present + absent;

  const columns = [
    {
      key: "title",
      header: "Event",
      sortable: true,
      primary: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-fg">{row.title}</p>
          <p className="truncate text-[12.5px] text-muted">{row.location}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (row) => new Date(row.date || 0).getTime(),
      render: (row) => <span className="tabular whitespace-nowrap">{formatDate(row.date)}</span>,
    },
    { key: "status", header: "Event", render: (row) => <StatusBadge status={row.status} label={row.status === "Ongoing" ? "Live" : undefined} /> },
    {
      key: "attendance",
      header: "Attendance",
      sortable: true,
      sortValue: (row) => row.record?.status || "",
      render: (row) =>
        row.record && row.record.status !== "Not Marked" ? <StatusBadge status={row.record.status} /> : <Badge tone="neutral">Not marked</Badge>,
    },
    { key: "markedBy", header: "Marked by", hideOnMobile: true, render: (row) => row.record?.markedBy?.name || "—" },
  ];

  return (
    <>
      <PageHeader eyebrow="Service" title="Attendance" description="Your attendance across every event you've been assigned to." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Present" value={present} variant="mint" />
        <StatCard label="Absent" value={absent} />
        <StatCard label="Attendance rate" value={marked ? `${Math.round((present / marked) * 100)}%` : "—"} />
      </div>
      <DataTable
        caption="Attendance"
        columns={columns}
        rows={rows}
        rowKey="_id"
        loading={list.loading}
        error={list.status === "error" ? list.error : null}
        onRetry={list.reload}
        searchKeys={["title", "location"]}
        searchPlaceholder="Search events"
        initialSort={{ key: "date", dir: "desc" }}
        noun="events"
        empty={{ icon: CalendarCheck, title: "No attendance yet", description: "Attendance appears once you're assigned to events and teachers mark it." }}
      />
    </>
  );
}
