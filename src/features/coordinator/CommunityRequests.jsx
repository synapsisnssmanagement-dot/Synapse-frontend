"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, Copy, HandHeart, Inbox, Mail, MapPin, Phone, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import { useSocket } from "@/context/SocketContext";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";

const FILTERS = [
  { id: "new", label: "New" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
];

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function planHref(r) {
  const params = new URLSearchParams({
    request: r._id,
    title: `${r.category === "Other" ? "Community" : r.category} drive with ${r.orgName}`,
    description: `${r.description}\n\nRequested by ${r.orgName} (${r.contactName}, ${r.phone}).`,
    location: r.location,
  });
  if (r.preferredDate) params.set("date", toDateInput(r.preferredDate));
  return `/coordinatorlayout/createevent?${params.toString()}`;
}

function RequestCard({ request: r, busy, onStatus }) {
  return (
    <li className="flex flex-col rounded-xl border border-line bg-paper p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{r.category}</Badge>
        <StatusBadge status={r.status === "new" ? "pending" : r.status} label={r.status === "new" ? "New" : undefined} size="sm" />
        <span className="ml-auto text-[12px] text-subtle">{timeAgo(r.createdAt)}</span>
      </div>
      <p className="mt-3 text-[16px] font-semibold text-fg">{r.orgName}</p>
      <p className="mt-2 line-clamp-4 whitespace-pre-line text-[14px] leading-relaxed text-fg-2">{r.description}</p>
      <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
        <li className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" /> {r.location}
        </li>
        {r.preferredDate ? (
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" /> Preferred {formatDate(r.preferredDate)}
          </li>
        ) : null}
        <li className="flex items-center gap-2">
          <Phone aria-hidden="true" className="size-3.5 shrink-0" /> {r.contactName} · {r.phone}
          <button
            type="button"
            aria-label={`Copy ${r.contactName}'s phone number`}
            onClick={() => navigator.clipboard?.writeText(r.phone).then(() => toast.success("Number copied."))}
            className="rounded p-0.5 text-subtle hover:text-ink"
          >
            <Copy aria-hidden="true" className="size-3.5" />
          </button>
        </li>
        {r.email ? (
          <li className="flex items-center gap-2">
            <Mail aria-hidden="true" className="size-3.5 shrink-0" /> {r.email}
          </li>
        ) : null}
      </ul>
      {r.event ? (
        <p className="mt-4 rounded-lg border border-brand/25 bg-mint px-3 py-2 text-[13px] text-brand-700">
          Became the drive <strong>{r.event.title}</strong> on {formatDate(r.event.date)}.
        </p>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {r.status === "new" ? (
          <>
            <Button size="sm" icon={CalendarPlus} href={planHref(r)}>
              Plan a drive
            </Button>
            <Button size="sm" variant="ghost" icon={X} loading={busy} onClick={() => onStatus(r, "declined")}>
              Decline
            </Button>
          </>
        ) : r.status === "declined" ? (
          <Button size="sm" variant="ghost" icon={Undo2} loading={busy} onClick={() => onStatus(r, "new")}>
            Move back to new
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export default function CommunityRequests() {
  const tabsId = useId();
  const list = useResource(() => api.get("/api/nss/requests").then((res) => res.data?.requests || []), []);
  const [filter, setFilter] = useState("new");
  const [busyId, setBusyId] = useState(null);
  const socket = useSocket();
  const { reload } = list;

  useEffect(() => {
    if (!socket) return undefined;
    socket.on("request:new", reload);
    return () => socket.off("request:new", reload);
  }, [socket, reload]);

  const all = useMemo(() => list.data || [], [list.data]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, all.filter((r) => r.status === f.id).length])), [all]);
  const rows = all.filter((r) => r.status === filter);

  const setStatus = async (request, status) => {
    setBusyId(request._id);
    try {
      await api.put(`/api/nss/requests/${request._id}`, { status });
      list.mutate((items) => (items || []).map((r) => (r._id === request._id ? { ...r, status } : r)));
      toast.success(status === "declined" ? "Request declined." : "Moved back to new.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't update that request."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Help requests"
        description="NGOs, schools, panchayats and care homes ask your unit for help through the public request form. Turn a request into a drive in one click."
      />
      <Tabs id={tabsId} label="Filter requests" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} className="mb-5" />
      <div {...tabPanelProps(tabsId, filter)}>
        {list.loading ? (
          <CardGridSkeleton count={3} />
        ) : list.status === "error" ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : rows.length ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <RequestCard key={r._id} request={r} busy={busyId === r._id} onStatus={setStatus} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={filter === "new" ? Inbox : HandHeart}
            title={filter === "new" ? "No new requests" : filter === "accepted" ? "None accepted yet" : "Nothing declined"}
            description={
              filter === "new" ? "Share your college's request link with local organisations. New requests appear here instantly." : "Requests move here as you handle them."
            }
            action={
              filter === "new" ? (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Copy}
                  onClick={async () => {
                    const profile = await api.get("/api/coordinator/profile").catch(() => null);
                    const id = profile?.data?.data?.institution;
                    await navigator.clipboard?.writeText(`${window.location.origin}/request-help${id ? `?institution=${id}` : ""}`);
                    toast.success("Request form link copied.");
                  }}
                >
                  Copy request form link
                </Button>
              ) : null
            }
          />
        )}
      </div>
    </>
  );
}
