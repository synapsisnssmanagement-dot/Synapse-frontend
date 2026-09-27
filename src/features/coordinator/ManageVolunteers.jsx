"use client";

import { useMemo, useState } from "react";
import { CalendarRange, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "react-toastify";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { CardGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { sortEvents } from "./data";

function VolunteerCard({ person, selected, onToggle, trailing }) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors",
        selected ? "border-ink bg-canvas" : "border-line bg-paper hover:border-line-strong"
      )}
    >
      <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 size-4 accent-brand-700" />
      <Avatar name={person.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-fg">{person.name}</span>
        <span className="block truncate text-[12.5px] text-muted">{person.department || person.email}</span>
      </span>
      {trailing}
    </label>
  );
}

export default function ManageVolunteers() {
  const volunteers = useResource(() => getList("/api/coordinator/volunteers", "volunteers"), []);
  const events = useResource(() => getList("/api/coordinator/my-events", "events"), []);
  const [eventId, setEventId] = useState("");
  const assigned = useResource(() => (eventId ? api.get(`/api/coordinator/events/${eventId}`).then((res) => res.data?.event?.participants || []) : Promise.resolve([])), [eventId], {
    enabled: Boolean(eventId),
  });

  const [query, setQuery] = useState("");
  const [addPicked, setAddPicked] = useState([]);
  const [removePicked, setRemovePicked] = useState([]);
  const [busy, setBusy] = useState(null);


  const active = useMemo(() => sortEvents((events.data || []).filter((e) => e.status !== "Completed" && e.status !== "Cancelled")), [events.data]);
  const selectedEvent = active.find((e) => e._id === eventId);
  const assignedList = assigned.data || [];
  const assignedIds = new Set(assignedList.map((p) => String(p._id)));

  const q = query.trim().toLowerCase();
  const unassignedPool = (volunteers.data || []).filter((v) => !assignedIds.has(String(v._id)) && (!q || `${v.name} ${v.department}`.toLowerCase().includes(q)));
  const assignedPool = assignedList.filter((v) => !q || `${v.name} ${v.department || ""}`.toLowerCase().includes(q));

  const toggle = (setter) => (id) => setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const assign = async () => {
    setBusy("assign");
    try {
      await api.post("/api/coordinator/assignvolunteertoevents", { eventId, volunteerIds: addPicked });
      const added = (volunteers.data || []).filter((v) => addPicked.includes(v._id));
      assigned.mutate((list) => [...(list || []), ...added]);
      toast.success(`${added.length} ${added.length === 1 ? "volunteer" : "volunteers"} assigned to ${selectedEvent.title}.`);
      setAddPicked([]);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't assign those volunteers."));
    } finally {
      setBusy(null);
    }
  };

  const unassign = async () => {
    setBusy("remove");
    try {
      await api.post("/api/coordinator/unassign-volunteers", { eventId, volunteerIds: removePicked });
      assigned.mutate((list) => (list || []).filter((v) => !removePicked.includes(v._id)));
      toast.success(`${removePicked.length} ${removePicked.length === 1 ? "volunteer" : "volunteers"} removed from ${selectedEvent.title}.`);
      setRemovePicked([]);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't remove those volunteers."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="People" title="Volunteers" description="Build the team for an event, or free up volunteers who can't make it." />

      {events.status === "error" ? (
        <ErrorState title="We couldn't load your events" error={events.error} onRetry={events.reload} />
      ) : events.loading ? (
        <Skeleton className="h-11 w-full max-w-md" />
      ) : active.length ? (
        <Select
          label="Event"
          className="max-w-md"
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setAddPicked([]);
            setRemovePicked([]);
          }}
          placeholder="Choose an upcoming or live event"
        >
          {active.map((e) => (
            <option key={e._id} value={e._id}>
              {e.title} — {formatDate(e.date, "short")}
            </option>
          ))}
        </Select>
      ) : (
        <EmptyState icon={CalendarRange} title="No upcoming events" description="Create an event first, then build its volunteer team here." />
      )}

      {eventId ? (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-fg">{selectedEvent?.title}</p>
              {selectedEvent ? <StatusBadge status={selectedEvent.status} label={selectedEvent.status === "Ongoing" ? "Live" : undefined} /> : null}
            </div>
            <SearchInput value={query} onChange={setQuery} placeholder="Search volunteers" className="w-full sm:w-64" />
          </div>

          {volunteers.status === "error" || assigned.status === "error" ? (
            <ErrorState
              title="We couldn't load volunteers"
              error={volunteers.error || assigned.error}
              onRetry={() => {
                volunteers.reload();
                assigned.reload();
              }}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Available volunteers" description={`${unassignedPool.length} not yet on this event`}>
                {volunteers.loading || assigned.loading ? (
                  <CardGridSkeleton count={4} className="sm:grid-cols-1 xl:grid-cols-1" />
                ) : unassignedPool.length ? (
                  <div className="space-y-2">
                    <ul data-lenis-prevent className="scrollbar-quiet max-h-96 space-y-2 overflow-y-auto">
                      {unassignedPool.map((v) => (
                        <li key={v._id}>
                          <VolunteerCard person={v} selected={addPicked.includes(v._id)} onToggle={() => toggle(setAddPicked)(v._id)} />
                        </li>
                      ))}
                    </ul>
                    <Button fullWidth icon={UserPlus} disabled={!addPicked.length} loading={busy === "assign"} onClick={assign}>
                      {addPicked.length ? `Assign ${addPicked.length} selected` : "Select volunteers to assign"}
                    </Button>
                  </div>
                ) : (
                  <EmptyState size="sm" icon={Users} title={q ? "No matches" : "Everyone is assigned"} description={q ? "Try a different name or department." : "Every active volunteer is already on this event."} />
                )}
              </Panel>

              <Panel title="On this event" description={`${assignedPool.length} assigned`}>
                {assigned.loading ? (
                  <CardGridSkeleton count={4} className="sm:grid-cols-1 xl:grid-cols-1" />
                ) : assignedPool.length ? (
                  <div className="space-y-2">
                    <ul data-lenis-prevent className="scrollbar-quiet max-h-96 space-y-2 overflow-y-auto">
                      {assignedPool.map((v) => (
                        <li key={v._id}>
                          <VolunteerCard person={v} selected={removePicked.includes(v._id)} onToggle={() => toggle(setRemovePicked)(v._id)} />
                        </li>
                      ))}
                    </ul>
                    <Button fullWidth variant="danger-soft" icon={UserMinus} disabled={!removePicked.length} loading={busy === "remove"} onClick={unassign}>
                      {removePicked.length ? `Remove ${removePicked.length} selected` : "Select volunteers to remove"}
                    </Button>
                  </div>
                ) : (
                  <EmptyState size="sm" icon={Users} title="No volunteers yet" description="Assign volunteers from the list on the left." />
                )}
              </Panel>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
