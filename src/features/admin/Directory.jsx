"use client";

import { useId, useMemo, useState } from "react";
import { Check, Users, X } from "lucide-react";
import { LevelBadge, StatusBadge } from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import { getList } from "@/lib/api";
import { formatDate, formatNumber, photoOf } from "@/lib/format";
import PersonReview, { useModeration } from "./PersonReview";
import { PEOPLE, useDashboardStats, useInstitutionName } from "./people";

const STATUSES = ["all", "active", "pending", "rejected"];

function WeekStrip({ growth }) {
  const max = Math.max(1, ...growth.map((d) => d.count));
  const total = growth.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-paper p-5">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-muted">New this week</p>
        <p className="tabular text-sm font-semibold text-fg">{formatNumber(total)}</p>
      </div>
      <div className="mt-4 flex flex-1 items-end gap-1.5" role="img" aria-label={`${total} sign-ups in the last 7 days`}>
        {growth.map((day, i) => (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={i === growth.length - 1 ? "w-full rounded-t-[3px] bg-brand" : "w-full rounded-t-[3px] bg-ink/10"}
              style={{ height: `${Math.max(4, (day.count / max) * 56)}px` }}
              title={`${formatDate(day.date, "short")}: ${day.count}`}
            />
            <span className="text-[10px] text-subtle">{new Intl.DateTimeFormat("en-IN", { weekday: "narrow" }).format(new Date(day.date))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Directory({ role }) {
  const person = PEOPLE[role];
  const tabsId = useId();
  const list = useResource(() => getList(person.directory.list, person.directory.field), [role]);
  const stats = useDashboardStats();
  const institutionName = useInstitutionName();
  const [status, setStatus] = useState("all");
  const [reviewId, setReviewId] = useState(null);

  const rows = useMemo(() => list.data || [], [list.data]);
  const counts = useMemo(() => {
    const out = { all: rows.length, active: 0, pending: 0, rejected: 0 };
    rows.forEach((row) => {
      if (out[row.status] != null) out[row.status] += 1;
    });
    return out;
  }, [rows]);
  const visible = status === "all" ? rows : rows.filter((row) => row.status === status);
  const reviewing = rows.find((row) => row._id === reviewId) || null;

  const moderation = useModeration(person, person.directory, (target, nextStatus) => {
    list.mutate((current) => (current || []).map((row) => (row._id === target._id ? { ...row, status: nextStatus } : row)));
    stats.reload();
  });

  const roleStats = stats.data?.[role];
  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      primary: true,
      render: (row) => <Identity name={row.name} email={row.email} src={photoOf(row)} />,
    },
    { key: "department", header: "Department", sortable: true, render: (row) => row.department || "—" },
    {
      key: "institution",
      header: "Institution",
      sortable: true,
      sortValue: (row) => institutionName(row.institution),
      render: (row) => <span className="line-clamp-2">{institutionName(row.institution)}</span>,
    },
    ...(role === "student"
      ? [
          {
            key: "totalVolunteerHours",
            header: "Service",
            sortable: true,
            sortValue: (row) => Number(row.totalVolunteerHours) || 0,
            render: (row) => (
              <span className="flex flex-wrap items-center gap-2">
                <span className="tabular">{formatNumber(row.totalVolunteerHours || 0)} h</span>
                {row.level ? <LevelBadge level={row.level} size="sm" /> : null}
              </span>
            ),
          },
        ]
      : []),
    ...(role === "alumni" ? [{ key: "graduationYear", header: "Graduated", sortable: true, render: (row) => row.graduationYear || "—" }] : []),
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span className="flex flex-wrap gap-1.5">
          <StatusBadge status={row.status} />
          {row.role === "volunteer" ? <StatusBadge status="active" label="Volunteer" /> : null}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      hideOnMobile: true,
      hideBelow: "2xl",
      sortValue: (row) => new Date(row.createdAt || 0).getTime(),
      render: (row) => <span className="tabular whitespace-nowrap">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title={person.title}
        description={`Every ${person.singular} account across your institutions. Open a row to see the full profile.`}
        actions={
          <Button href={person.pendingHref} variant="outline" size="sm">
            Pending approvals
            {roleStats?.pending ? <span className="tabular rounded-sm bg-amber-100 px-1.5 text-[11px] font-bold text-amber-800">{roleStats.pending}</span> : null}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.loading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[118px] rounded-xl" />)
        ) : (
          <>
            <StatCard label={`All ${person.plural}`} value={list.data ? counts.all : roleStats?.total} icon={person.icon} />
            <StatCard label="Active" value={list.data ? counts.active : roleStats?.active} variant="mint" />
            <StatCard
              label="Awaiting approval"
              value={list.data ? counts.pending : roleStats?.pending}
              footnote={(list.data ? counts.pending : roleStats?.pending) ? "Needs review" : "All clear"}
            />
            {roleStats?.growth ? (
              <div className="col-span-2 lg:col-span-1">
                <WeekStrip growth={roleStats.growth} />
              </div>
            ) : role === "student" ? null : (
              <StatCard label="Rejected" value={counts.rejected} />
            )}
          </>
        )}
      </div>

      <Tabs
        id={tabsId}
        label={`Filter ${person.plural} by status`}
        className="mb-4"
        value={status}
        onChange={setStatus}
        tabs={STATUSES.map((id) => ({ id, label: id === "all" ? "All" : id.charAt(0).toUpperCase() + id.slice(1), count: counts[id] }))}
      />

      <div {...tabPanelProps(tabsId, status)}>
        <DataTable
          key={status}
          caption={`${person.title} — ${status}`}
          columns={columns}
          rows={visible}
          loading={list.loading}
          error={list.status === "error" ? list.error : null}
          onRetry={list.reload}
          searchKeys={["name", "email", "department"]}
          searchPlaceholder={`Search ${person.plural}`}
          initialSort={{ key: "createdAt", dir: "desc" }}
          noun={person.plural}
          onRowClick={(row) => setReviewId(row._id)}
          rowActions={(row) => (
            <>
              {row.status !== "active" ? (
                <IconButton
                  size="sm"
                  variant="outline"
                  icon={Check}
                  label={`Approve ${row.name}`}
                  disabled={moderation.busy === `approve:${row._id}`}
                  onClick={() => moderation.approve(row)}
                  className="hover:border-brand/40 hover:text-brand-700"
                />
              ) : null}
              {row.status !== "rejected" ? (
                <IconButton
                  size="sm"
                  variant="outline"
                  icon={X}
                  label={`Reject ${row.name}`}
                  onClick={() => moderation.requestReject(row)}
                  className="hover:border-red-200 hover:text-red-600"
                />
              ) : null}
            </>
          )}
          empty={{
            icon: Users,
            title: status === "all" ? `No ${person.plural} yet` : `No ${status} ${person.plural}`,
            description:
              status === "all"
                ? `${person.title} appear here after they sign up and verify their email.`
                : `Nobody is ${status} right now. Switch the filter above to see everyone else.`,
          }}
        />
      </div>

      <PersonReview
        open={Boolean(reviewing)}
        onClose={() => setReviewId(null)}
        target={reviewing}
        person={person}
        institutionName={institutionName}
        moderation={moderation}
      />
      {moderation.dialog}
    </>
  );
}
