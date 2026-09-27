"use client";

import { useMemo, useState } from "react";
import { CalendarDays, HandCoins, Lock, MapPin, Unlock, Users } from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateBlock from "@/components/ui/DateBlock";
import PageHeader from "@/components/ui/PageHeader";
import Progress from "@/components/ui/Progress";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage, getList } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { participantCount } from "./data";
import useResource from "@/hooks/useResource";

// There is no fixed target on the backend, so the bar reflects momentum
// toward a soft milestone rather than a real goal.
const MILESTONE_STEP = 10000;

function DonationCard({ event, busy, onToggle }) {
  const collected = Number(event.totalCollected) || 0;
  const milestone = Math.max(MILESTONE_STEP, Math.ceil((collected + 1) / MILESTONE_STEP) * MILESTONE_STEP);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper">
      <div className="flex items-start gap-3 p-5">
        <DateBlock date={event.date} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-fg">{event.title}</p>
            <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} size="sm" />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            {event.location ? (
              <span className="flex items-center gap-1">
                <MapPin aria-hidden="true" className="size-3.5" /> {event.location}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Users aria-hidden="true" className="size-3.5" /> {participantCount(event)} volunteers
            </span>
          </p>
        </div>
      </div>
      <div className="mt-auto space-y-4 border-t border-line bg-canvas p-5">
        <div>
          <p className="tabular text-2xl font-semibold tracking-[-0.03em] text-fg">{formatCurrency(collected)}</p>
          <Progress value={collected} max={milestone} size="sm" valueLabel={`toward ${formatCurrency(milestone)}`} className="mt-2" />
        </div>
        <Button
          fullWidth
          variant={event.donationOpen ? "danger-soft" : "primary"}
          icon={event.donationOpen ? Lock : Unlock}
          loading={busy}
          onClick={() => onToggle(event)}
        >
          {event.donationOpen ? "Close donations" : "Open donations"}
        </Button>
      </div>
    </article>
  );
}

export default function ManageDonation() {
  const events = useResource(() => getList("/api/coordinator/my-events", "events"), []);
  const [busyId, setBusyId] = useState(null);

  const rows = useMemo(() => {
    const list = events.data || [];
    return [...list].sort((a, b) => (b.donationOpen === a.donationOpen ? (Number(b.totalCollected) || 0) - (Number(a.totalCollected) || 0) : b.donationOpen ? 1 : -1));
  }, [events.data]);

  const toggle = async (event) => {
    setBusyId(event._id);
    try {
      const res = await api.put(`/api/coordinator/toggle-donation/${event._id}`, {});
      const donationOpen = res.data?.message?.includes("OPEN") ?? !event.donationOpen;
      events.mutate((list) => (list || []).map((e) => (e._id === event._id ? { ...e, donationOpen } : e)));
      toast.success(donationOpen ? `Donations are open for ${event.title}.` : `Donations are closed for ${event.title}.`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't change that setting."));
    } finally {
      setBusyId(null);
    }
  };

  const totalRaised = rows.reduce((sum, e) => sum + (Number(e.totalCollected) || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Giving"
        title="Donations"
        description="Alumni can support any event where donations are open. Toggle it per event — closing it stops new gifts, not what's already given."
        meta={totalRaised ? <span className="tabular font-semibold text-fg">{formatCurrency(totalRaised)} raised across your events</span> : null}
      />

      {events.loading ? (
        <CardGridSkeleton count={4} />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((event) => (
            <DonationCard key={event._id} event={event} busy={busyId === event._id} onToggle={toggle} />
          ))}
        </div>
      ) : (
        <EmptyState icon={HandCoins} title="No events yet" description="Once you create an event, you can open it to alumni donations here." />
      )}
    </>
  );
}
