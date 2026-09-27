"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Check, MapPin, Users, X } from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { sortEvents, useMyEvents } from "./data";

function EventPicker({ events, onSelect }) {
  const eligible = sortEvents(events.filter((e) => e.status !== "Cancelled"));
  if (!eligible.length) {
    return <EmptyState icon={CalendarRange} title="No events assigned yet" description="Once a coordinator assigns you to an event, it appears here." />;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {eligible.map((event) => (
        <li key={event._id}>
          <button
            type="button"
            onClick={() => onSelect(event)}
            className="flex h-full w-full flex-col rounded-xl border border-line bg-paper p-5 text-left transition-colors hover:border-ink"
          >
            <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} className="self-start" />
            <p className="mt-3 text-[16px] font-semibold text-fg">{event.title}</p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
              <li className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-3.5" /> {formatDate(event.date)}
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-3.5" /> {event.location || "No location"}
              </li>
            </ul>
            <span className="mt-auto pt-4 text-[13px] font-semibold text-brand-700">Take attendance →</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function AttendanceSheet({ event, onClose }) {
  const participants = useResource(
    () => api.get(`/api/events/participantsofevents/${event._id}`).then((res) => res.data?.participants || []),
    [event._id]
  );
  const [status, setStatus] = useState({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const people = participants.data || [];
  const statusOf = (id) => status[id] || "Present";
  const present = people.filter((s) => statusOf(s._id) === "Present").length;

  const q = query.trim().toLowerCase();
  const visible = q ? people.filter((s) => `${s.name} ${s.department || ""}`.toLowerCase().includes(q)) : people;

  const setOne = (id, value) => setStatus((prev) => ({ ...prev, [id]: value }));
  const setAll = (value) => setStatus(Object.fromEntries(people.map((s) => [s._id, value])));

  const submit = async () => {
    setSaving(true);
    try {
      const attendanceList = people.map((s) => ({ studentId: s._id, status: statusOf(s._id) }));
      await api.post(`/api/teacher/attendance/${event._id}`, { attendanceList });
      toast.success(`Attendance saved for ${event.title}.`);
      setSavedAt(new Date());
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save attendance."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={onClose} className="-ml-2 mb-2 text-muted">
            ← All events
          </Button>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-fg">{event.title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5" /> {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-3.5" /> {event.location || "No location"}
            </span>
          </p>
        </div>
        {people.length ? (
          <div className="rounded-lg border border-line bg-canvas px-4 py-2.5 text-right">
            <p className="tabular text-lg font-semibold text-fg">
              {present} <span className="text-[13px] font-normal text-muted">/ {people.length} present</span>
            </p>
          </div>
        ) : null}
      </div>

      {participants.loading ? (
        <TableSkeleton rows={6} columns={3} />
      ) : participants.status === "error" ? (
        <ErrorState error={participants.error} onRetry={participants.reload} />
      ) : people.length ? (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
            <SearchInput value={query} onChange={setQuery} placeholder="Search volunteers" className="flex-1 sm:max-w-xs" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAll("Present")}>
                Mark all present
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAll("Absent")}>
                Mark all absent
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {visible.map((student) => {
              const present2 = statusOf(student._id) === "Present";
              return (
                <li key={student._id} className="flex items-center gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium text-fg">{student.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">{student.department || student.email}</span>
                  </span>
                  <div role="group" aria-label={`Attendance for ${student.name}`} className="flex shrink-0 overflow-hidden rounded-lg border border-line">
                    <button
                      type="button"
                      aria-pressed={present2}
                      onClick={() => setOne(student._id, "Present")}
                      className={cx(
                        "flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors",
                        present2 ? "bg-brand text-ink" : "bg-paper text-muted hover:bg-canvas"
                      )}
                    >
                      <Check aria-hidden="true" className="size-3.5" /> Present
                    </button>
                    <button
                      type="button"
                      aria-pressed={!present2}
                      onClick={() => setOne(student._id, "Absent")}
                      className={cx(
                        "flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors",
                        !present2 ? "bg-red-600 text-white" : "bg-paper text-muted hover:bg-canvas"
                      )}
                    >
                      <X aria-hidden="true" className="size-3.5" /> Absent
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <EmptyState icon={Users} title="No volunteers on this event" description="Attendance can be recorded once volunteers are assigned." />
      )}

      {people.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted">{savedAt ? `Saved at ${formatDate(savedAt, "time")}.` : "Everyone defaults to present — mark exceptions, then save."}</p>
          <Button icon={Check} loading={saving} onClick={submit}>
            Save attendance
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AttendanceByTeacher() {
  const events = useMyEvents();
  const [selected, setSelected] = useState(null);

  const eligible = useMemo(() => sortEvents((events.data || []).filter((e) => e.status !== "Cancelled")), [events.data]);
  const current = selected ? eligible.find((e) => e._id === selected._id) || selected : null;

  return (
    <>
      <PageHeader eyebrow="Events" title="Attendance" description="Mark who showed up. Everyone starts present — flip the exceptions and save." />
      {events.loading ? (
        <CardGridSkeleton count={3} />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : current ? (
        <AttendanceSheet event={current} onClose={() => setSelected(null)} />
      ) : (
        <EventPicker events={events.data || []} onSelect={setSelected} />
      )}
    </>
  );
}
