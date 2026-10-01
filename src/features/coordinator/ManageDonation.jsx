"use client";

import { useMemo, useState } from "react";
import { CalendarDays, HandCoins, Lock, MapPin, Target, Unlock, Users } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateBlock from "@/components/ui/DateBlock";
import { Modal } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Progress from "@/components/ui/Progress";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage, getList } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { participantCount } from "./data";
import useResource from "@/hooks/useResource";

// Without a goal set, the bar reflects momentum toward a soft milestone instead.
const MILESTONE_STEP = 10000;

function DonationCard({ event, busy, onToggle, onSetGoal }) {
  const collected = Number(event.totalCollected) || 0;
  const goal = Number(event.donationGoal) || 0;
  const milestone = goal || Math.max(MILESTONE_STEP, Math.ceil((collected + 1) / MILESTONE_STEP) * MILESTONE_STEP);

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
          <Progress
            value={collected}
            max={milestone}
            size="sm"
            valueLabel={goal ? `of ${formatCurrency(goal)} goal` : `toward ${formatCurrency(milestone)}`}
            className="mt-2"
          />
        </div>
        <div className="flex gap-2">
          <Button
            fullWidth
            variant={event.donationOpen ? "danger-soft" : "primary"}
            icon={event.donationOpen ? Lock : Unlock}
            loading={busy}
            onClick={() => onToggle(event)}
          >
            {event.donationOpen ? "Close" : "Open"}
          </Button>
          <Button fullWidth variant="outline" icon={Target} onClick={() => onSetGoal(event)}>
            {goal ? "Edit goal" : "Set goal"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function GoalModal({ event, onClose, onSaved }) {
  const [value, setValue] = useState(event ? String(event.donationGoal || "") : "");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const goal = Number(value);
    if (!Number.isFinite(goal) || goal < 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/coordinator/donation-goal/${event._id}`, { goal });
      toast.success("Goal updated.");
      onSaved(event._id, goal);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save that goal."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(event)} onClose={onClose} title="Donation goal" description={event?.title}>
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Target amount (₹)"
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 50000"
          autoFocus
        />
        <p className="text-[12.5px] text-muted">Set 0 to remove the goal and show momentum toward a soft milestone instead.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManageDonation() {
  const events = useResource(() => getList("/api/coordinator/my-events", "events"), []);
  const [busyId, setBusyId] = useState(null);
  const [goalEvent, setGoalEvent] = useState(null);

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
            <DonationCard key={event._id} event={event} busy={busyId === event._id} onToggle={toggle} onSetGoal={setGoalEvent} />
          ))}
        </div>
      ) : (
        <EmptyState icon={HandCoins} title="No events yet" description="Once you create an event, you can open it to alumni donations here." />
      )}

      <GoalModal
        event={goalEvent}
        onClose={() => setGoalEvent(null)}
        onSaved={(eventId, goal) => {
          events.mutate((list) => (list || []).map((e) => (e._id === eventId ? { ...e, donationGoal: goal } : e)));
          setGoalEvent(null);
        }}
      />
    </>
  );
}
