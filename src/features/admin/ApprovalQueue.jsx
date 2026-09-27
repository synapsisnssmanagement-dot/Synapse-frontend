"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, FileCheck2, FileX2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import useResource from "@/hooks/useResource";
import api, { getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate, photoOf, plural } from "@/lib/format";
import PersonReview, { useModeration } from "./PersonReview";
import { PEOPLE, PEOPLE_ORDER, documentUrl, useDashboardStats, useInstitutionName } from "./people";

function QueueSwitcher({ current, stats }) {
  return (
    <nav aria-label="Approval queues" className="scrollbar-quiet -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
      {PEOPLE_ORDER.map((key) => {
        const item = PEOPLE[key];
        const count = stats?.[key]?.pending;
        const active = key === current;
        const Icon = item.queueIcon;
        return (
          <Link
            key={key}
            href={item.pendingHref}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex h-10 shrink-0 items-center gap-2.5 rounded-lg border px-3.5 text-[13.5px] font-semibold transition-colors",
              active ? "border-ink bg-ink text-white" : "border-line bg-paper text-fg-2 hover:border-line-strong hover:text-fg"
            )}
          >
            <Icon aria-hidden="true" className={cx("size-4", active ? "text-brand" : "text-subtle")} />
            {item.title}
            {count != null ? (
              <span
                className={cx(
                  "tabular rounded-sm px-1.5 py-0.5 text-[11px] font-bold",
                  active ? "bg-white/15 text-white" : count ? "bg-amber-100 text-amber-800" : "bg-mist text-muted"
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export default function ApprovalQueue({ role }) {
  const person = PEOPLE[role];
  const list = useResource(() => getList(person.pending.list, person.pending.field), [role]);
  const stats = useDashboardStats();
  const institutionName = useInstitutionName();
  const [reviewId, setReviewId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const rows = list.data || [];
  const reviewing = rows.find((row) => row._id === reviewId) || null;

  const moderation = useModeration(person, person.pending, (target) => {
    list.mutate((current) => (current || []).filter((row) => row._id !== target._id));
    setReviewId((id) => (id === target._id ? null : id));
    stats.reload();
  });

  const approveMany = async (selected, clear) => {
    setBulkBusy(true);
    const results = await Promise.allSettled(selected.map((row) => api.put(person.pending.approve(row._id), {})));
    const approved = selected.filter((_, i) => results[i].status === "fulfilled").map((row) => row._id);
    list.mutate((current) => (current || []).filter((row) => !approved.includes(row._id)));
    if (approved.length) toast.success(`Approved ${plural(approved.length, person.singular, person.plural)}.`);
    if (approved.length < selected.length) toast.error(`${selected.length - approved.length} could not be approved. Please try them again.`);
    clear();
    setBulkBusy(false);
    stats.reload();
  };

  const columns = [
    {
      key: "name",
      header: "Applicant",
      sortable: true,
      primary: true,
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setReviewId(row._id);
          }}
          className="group/name -m-1 rounded-md p-1 text-left"
          aria-label={`Review ${row.name}`}
        >
          <Identity name={row.name} email={row.email} src={photoOf(row)} />
        </button>
      ),
    },
    { key: "department", header: "Department", sortable: true, render: (row) => row.department || "—" },
    {
      key: "institution",
      header: "Institution",
      sortValue: (row) => institutionName(row.institution),
      sortable: true,
      render: (row) => <span className="line-clamp-2">{institutionName(row.institution)}</span>,
    },
    ...(role === "alumni"
      ? [{ key: "graduationYear", header: "Graduated", sortable: true, render: (row) => row.graduationYear || "—" }]
      : []),
    ...(person.hasDocument
      ? [
          {
            key: "document",
            header: "Document",
            render: (row) =>
              documentUrl(row) ? (
                <Badge tone="success" icon={FileCheck2}>
                  Attached
                </Badge>
              ) : (
                <Badge tone="danger" icon={FileX2}>
                  Missing
                </Badge>
              ),
          },
        ]
      : []),
    {
      key: "createdAt",
      header: "Submitted",
      sortable: true,
      sortValue: (row) => new Date(row.createdAt || 0).getTime(),
      render: (row) => <span className="tabular whitespace-nowrap">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Approvals"
        title={`Pending ${person.plural}`}
        description={`New ${person.singular} accounts wait here after email verification. Approving lets them sign in; rejecting keeps them out until you change your mind.`}
      />
      <QueueSwitcher current={role} stats={stats.data} />

      <DataTable
        caption={`Pending ${person.plural}`}
        columns={columns}
        rows={rows}
        loading={list.loading}
        error={list.status === "error" ? list.error : null}
        onRetry={list.reload}
        searchKeys={["name", "email", "department"]}
        searchPlaceholder={`Search pending ${person.plural}`}
        initialSort={{ key: "createdAt", dir: "asc" }}
        noun={person.plural}
        selectable
        onRowClick={(row) => setReviewId(row._id)}
        bulkActions={(selected, clear) => (
          <Button size="sm" variant="light" icon={Check} loading={bulkBusy} onClick={() => approveMany(selected, clear)}>
            Approve {selected.length}
          </Button>
        )}
        rowActions={(row) => (
          <>
            <Button size="sm" variant="danger-soft" icon={X} onClick={() => moderation.requestReject(row)} aria-label={`Reject ${row.name}`}>
              Reject
            </Button>
            <Button
              size="sm"
              icon={Check}
              loading={moderation.busy === `approve:${row._id}`}
              onClick={() => moderation.approve(row)}
              aria-label={`Approve ${row.name}`}
            >
              Approve
            </Button>
          </>
        )}
        empty={{
          icon: CheckCircle2,
          title: `No ${person.plural} waiting`,
          description: `New ${person.singular} sign-ups will appear here once they verify their email.`,
          action: (
            <Button href={person.directoryHref} variant="outline" size="sm">
              View all {person.plural}
            </Button>
          ),
        }}
      />

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
