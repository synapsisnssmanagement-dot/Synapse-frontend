"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, CalendarRange, Clock3, MapPin, Pencil, Play, Presentation, Square, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import { Drawer } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import api, { errorMessage } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { isPast, participantCount, presentCount, sortEvents, teacherCount, useMyEvents } from "./data";
import useEventLifecycle from "./lifecycle";

const FILTERS = [
  { id: "Upcoming", label: "Upcoming" },
  { id: "Ongoing", label: "Live" },
  { id: "Completed", label: "Completed" },
  { id: "all", label: "All" },
];

function attendanceFor(event, studentId) {
  return (event.attendance || []).find((a) => String(a.student?._id || a.student) === String(studentId))?.status;
}

function EventRow({ event, onOpen, lifecycle }) {
  const overdue = event.status === "Upcoming" && isPast(event);
  return (
    <li className="group flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 transition-colors hover:border-line-strong sm:flex-row sm:items-center sm:p-5">
      <button type="button" onClick={() => onOpen(event)} className="flex min-w-0 flex-1 items-center gap-4 text-left" aria-label={`Open ${event.title}`}>
        <DateBlock date={event.date} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[16px] font-semibold tracking-[-0.015em] text-fg group-hover:text-ink">{event.title}</span>
            <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} />
            {overdue ? <Badge tone="danger">Overdue</Badge> : null}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-3.5" />
              {event.location || "No location"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {event.status === "Completed" && event.calculatedHours ? `${event.calculatedHours} h recorded` : `${event.hours || 0} h planned`}
            </span>
            <span className="flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-3.5" />
              {event.status === "Upcoming" ? `${participantCount(event)} volunteers` : `${presentCount(event)} / ${participantCount(event)} present`}
            </span>
            <span className="flex items-center gap-1.5">
              <Presentation aria-hidden="true" className="size-3.5" />
              {teacherCount(event)} {teacherCount(event) === 1 ? "teacher" : "teachers"}
            </span>
          </span>
        </span>
      </button>
      <div className="flex shrink-0 gap-2 sm:justify-end">
        {event.status === "Upcoming" ? (
          <Button size="sm" variant="dark" icon={Play} onClick={() => lifecycle.start(event)}>
            Start
          </Button>
        ) : null}
        {event.status === "Ongoing" ? (
          <Button size="sm" icon={Square} onClick={() => lifecycle.complete(event)}>
            Complete
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => onOpen(event)}>
          Details
        </Button>
      </div>
    </li>
  );
}

function EditDrawer({ event, open, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    title: event?.title || "",
    description: event?.description || "",
    location: event?.location || "",
    date: event?.date ? String(event.date).slice(0, 10) : "",
    hours: event?.hours ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const update = (e) => setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const hours = Number(values.hours);
    if (!values.title.trim() || !values.location.trim() || !values.date || !(hours > 0 && hours <= 24)) {
      toast.error("Fill in the name, date, location and hours (1 to 24).");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/api/coordinator/events/${event._id}`, {
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        date: values.date,
        hours,
      });
      toast.success("Event updated.");
      onSaved({ ...event, ...values, hours, ...(res.data?.event ? { date: res.data.event.date } : {}) });
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save the event."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Edit event"
      title={event?.title || ""}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-event-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-event-form" onSubmit={save} className="space-y-5" noValidate>
        <Input label="Event name" name="title" value={values.title} onChange={update} required />
        <Textarea label="Description" name="description" rows={5} value={values.description} onChange={update} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Date" name="date" type="date" leading={CalendarDays} value={values.date} onChange={update} required />
          <Input label="Planned hours" name="hours" type="number" min={1} max={24} step="0.5" leading={Clock3} value={values.hours} onChange={update} required />
        </div>
        <Input label="Location" name="location" leading={MapPin} value={values.location} onChange={update} required />
        <p className="text-[13px] text-muted">To start or complete the event, use the buttons on the event itself so times and hours are recorded correctly.</p>
      </form>
    </Drawer>
  );
}

function DetailDrawer({ event, open, onClose, onEdit, lifecycle }) {
  const volunteers = (event?.participants || []).filter((p) => p && typeof p === "object");
  const teachers = (event?.assignedTeacher || []).filter((t) => t && typeof t === "object");
  const cover = event?.images?.[0]?.url;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Event"
      title={event?.title || ""}
      size="xl"
      footer={
        event ? (
          <>
            {event.status !== "Completed" ? (
              <Button variant="outline" icon={Pencil} onClick={() => onEdit(event)}>
                Edit
              </Button>
            ) : null}
            {event.status === "Upcoming" ? (
              <Button variant="dark" icon={Play} onClick={() => lifecycle.start(event)}>
                Start event
              </Button>
            ) : null}
            {event.status === "Ongoing" ? (
              <Button icon={Square} onClick={() => lifecycle.complete(event)}>
                Complete event
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {event ? (
        <div className="space-y-8">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary upload shown at natural aspect
            <img src={cover} alt={event.images[0].caption || ""} className="max-h-72 w-full rounded-lg object-cover" />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} />
            {event.donationOpen ? <Badge tone="info">Donations open</Badge> : null}
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Date", formatDate(event.date, "long")],
              ["Location", event.location],
              ["Hours", event.calculatedHours ? `${event.calculatedHours} recorded (${event.hours} planned)` : `${event.hours} planned`],
              ["Attendance", `${presentCount(event)} present of ${participantCount(event)} assigned`],
              ...(event.startTime ? [["Started", formatDate(event.startTime, "datetime")]] : []),
              ...(event.endTime ? [["Completed", formatDate(event.endTime, "datetime")]] : []),
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line p-4">
                <dt className="eyebrow text-[0.62rem] text-muted">{label}</dt>
                <dd className="mt-2 text-[14.5px] font-medium text-fg">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {event.description ? (
            <section>
              <h3 className="eyebrow mb-3 text-muted">About</h3>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg-2">{event.description}</p>
            </section>
          ) : null}
          <section>
            <h3 className="eyebrow mb-3 text-muted">Teachers ({teachers.length})</h3>
            {teachers.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {teachers.map((t) => (
                  <li key={t._id} className="rounded-lg border border-line p-3">
                    <Identity name={t.name} email={t.email} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-line-strong p-4 text-[14px] text-muted">
                No teacher yet — assign one from Teachers so attendance can be taken.
              </p>
            )}
          </section>
          <section>
            <h3 className="eyebrow mb-3 text-muted">Volunteers ({volunteers.length})</h3>
            {volunteers.length ? (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {volunteers.map((v) => {
                  const status = attendanceFor(event, v._id);
                  return (
                    <li key={v._id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <Identity name={v.name} meta={v.department} />
                      {status ? <StatusBadge status={status} /> : <Badge tone="neutral">Not marked</Badge>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-line-strong p-4 text-[14px] text-muted">No volunteers assigned yet.</p>
            )}
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

export default function MyEvents() {
  const tabsId = useId();
  const events = useMyEvents();
  const [filter, setFilter] = useState("Upcoming");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState({ event: null, key: 0 });

  const replace = (updated) => events.mutate((list) => (list || []).map((e) => (e._id === updated._id ? { ...e, ...updated } : e)));
  const lifecycle = useEventLifecycle(replace);

  const all = useMemo(() => events.data || [], [events.data]);
  const counts = useMemo(() => {
    const out = { Upcoming: 0, Ongoing: 0, Completed: 0, all: all.length };
    all.forEach((e) => {
      if (out[e.status] != null) out[e.status] += 1;
    });
    return out;
  }, [all]);

  const q = query.trim().toLowerCase();
  const visible = sortEvents(all.filter((e) => (filter === "all" || e.status === filter) && (!q || `${e.title} ${e.location}`.toLowerCase().includes(q))));
  const open = all.find((e) => e._id === openId) || null;

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="My events"
        description="Every drive you coordinate — start it on the day, complete it to credit hours, and keep an eye on who is going."
        meta={
          events.data ? (
            <>
              <span>{formatNumber(counts.Upcoming)} upcoming</span>
              <span>{formatNumber(counts.Ongoing)} live</span>
              <span>{formatNumber(counts.Completed)} completed</span>
            </>
          ) : null
        }
        actions={
          <Button href="/coordinatorlayout/createevent" icon={CalendarPlus}>
            Create event
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Tabs id={tabsId} label="Filter events" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} className="flex-1" />
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name or place" className="w-full lg:w-72" />
      </div>

      <div {...tabPanelProps(tabsId, filter)}>
        {events.loading ? (
          <CardGridSkeleton count={3} className="sm:grid-cols-1 xl:grid-cols-1" />
        ) : events.status === "error" ? (
          <ErrorState title="We couldn't load your events" error={events.error} onRetry={events.reload} />
        ) : visible.length ? (
          <ul className="space-y-3">
            {visible.map((event) => (
              <EventRow key={event._id} event={event} onOpen={(e) => setOpenId(e._id)} lifecycle={lifecycle} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarRange}
            title={q ? "No events match your search" : filter === "Ongoing" ? "Nothing is live right now" : filter === "Completed" ? "No completed events yet" : "No events here"}
            description={q ? "Try a different name or place." : "Events you coordinate appear here as soon as they are created."}
            action={
              !q && filter !== "Completed" ? (
                <Button href="/coordinatorlayout/createevent" size="sm" icon={CalendarPlus}>
                  Create event
                </Button>
              ) : null
            }
          />
        )}
      </div>

      <DetailDrawer
        event={open}
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        lifecycle={lifecycle}
        onEdit={(event) => setEditing((prev) => ({ event, key: prev.key + 1 }))}
      />
      <EditDrawer
        key={editing.key}
        event={editing.event}
        open={Boolean(editing.event)}
        onClose={() => setEditing((prev) => ({ ...prev, event: null }))}
        onSaved={(updated) => {
          replace(updated);
          setEditing((prev) => ({ ...prev, event: null }));
        }}
      />
      {lifecycle.dialog}
    </>
  );
}
