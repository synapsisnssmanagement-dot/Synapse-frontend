"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, Presentation, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { sortEvents } from "./data";

export default function ManageTeacher() {
  const teachers = useResource(() => getList("/api/coordinator/teachers", "teachers"), []);
  const events = useResource(() => getList("/api/coordinator/events", "events"), []);
  const [eventId, setEventId] = useState("");
  const [picked, setPicked] = useState([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const active = useMemo(() => sortEvents((events.data || []).filter((e) => e.status !== "Completed" && e.status !== "Cancelled")), [events.data]);
  const selected = active.find((e) => e._id === eventId);
  const assignedIds = new Set((selected?.assignedTeacher || []).map((t) => String(t._id || t)));
  const q = query.trim().toLowerCase();
  const available = (teachers.data || []).filter(
    (t) => !assignedIds.has(String(t._id)) && (!q || `${t.name} ${t.email} ${t.department}`.toLowerCase().includes(q))
  );

  const togglePick = (id) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const assign = async () => {
    setSaving(true);
    try {
      await api.post("/api/coordinator/assign-teacher", { eventId, teacherIds: picked });
      const added = (teachers.data || []).filter((t) => picked.includes(t._id));
      events.mutate((list) => (list || []).map((e) => (e._id === eventId ? { ...e, assignedTeacher: [...(e.assignedTeacher || []), ...added] } : e)));
      toast.success(`${added.length === 1 ? added[0].name : `${added.length} teachers`} assigned to ${selected.title}.`);
      setPicked([]);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't assign those teachers."));
    } finally {
      setSaving(false);
    }
  };

  const unassign = async () => {
    const { event, teacher } = removing;
    setBusy(true);
    try {
      await api.delete("/api/coordinator/unassign-teacher", { data: { eventId: event._id, teacherId: teacher._id } });
      events.mutate((list) =>
        (list || []).map((e) => (e._id === event._id ? { ...e, assignedTeacher: (e.assignedTeacher || []).filter((t) => String(t._id || t) !== String(teacher._id)) } : e))
      );
      toast.success(`${teacher.name} removed from ${event.title}.`);
      setRemoving(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't remove that teacher."));
    } finally {
      setBusy(false);
    }
  };

  const loading = teachers.loading || events.loading;
  const failed = teachers.status === "error" ? teachers : events.status === "error" ? events : null;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Teachers"
        description="Every drive needs at least one teacher to take attendance on the day. Assign them here; they are notified straight away."
        meta={teachers.data ? <span>{teachers.data.length} active teachers at your institution</span> : null}
      />

      {failed ? (
        <ErrorState title="We couldn't load teachers and events" error={failed.error} onRetry={() => { teachers.reload(); events.reload(); }} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
          <Panel title="Assign teachers" description="Choose an event, then the teachers to add." className="h-fit xl:sticky xl:top-0">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : active.length ? (
              <div className="space-y-5">
                <Select
                  label="Event"
                  value={eventId}
                  onChange={(e) => {
                    setEventId(e.target.value);
                    setPicked([]);
                  }}
                  placeholder="Choose an upcoming or live event"
                >
                  {active.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.title} — {formatDate(e.date, "short")}
                    </option>
                  ))}
                </Select>

                {selected ? (
                  <>
                    <SearchInput value={query} onChange={setQuery} placeholder="Search teachers" />
                    {available.length ? (
                      <fieldset>
                        <legend className="sr-only">Teachers to assign</legend>
                        <ul data-lenis-prevent className="scrollbar-quiet max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                          {available.map((t) => (
                            <li key={t._id}>
                              <label className={cx("flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-canvas", picked.includes(t._id) && "bg-mint/70")}>
                                <input type="checkbox" checked={picked.includes(t._id)} onChange={() => togglePick(t._id)} className="size-4 accent-brand-700" />
                                <Identity name={t.name} meta={t.department || t.email} />
                              </label>
                            </li>
                          ))}
                        </ul>
                      </fieldset>
                    ) : (
                      <p className="rounded-lg border border-dashed border-line-strong p-4 text-[13.5px] text-muted">
                        {q ? "No teachers match your search." : "Every active teacher is already on this event."}
                      </p>
                    )}
                    <Button fullWidth icon={UserPlus} disabled={!picked.length} loading={saving} onClick={assign}>
                      {picked.length ? `Assign ${picked.length} ${picked.length === 1 ? "teacher" : "teachers"}` : "Select teachers to assign"}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : (
              <EmptyState size="sm" icon={CalendarRange} title="No upcoming events" description="Create an event first, then assign its teachers here." />
            )}
          </Panel>

          <section aria-labelledby="assignments-title">
            <h2 id="assignments-title" className="eyebrow mb-3 text-muted">
              Assignments
            </h2>
            {loading ? (
              <TableSkeleton rows={4} columns={3} />
            ) : active.length ? (
              <ul className="space-y-3">
                {active.map((event) => {
                  const assigned = (event.assignedTeacher || []).filter((t) => t && typeof t === "object");
                  return (
                    <li key={event._id} className={cx("rounded-xl border bg-paper p-4 sm:p-5", event._id === eventId ? "border-ink" : "border-line")}>
                      <div className="flex items-start gap-4">
                        <DateBlock date={event.date} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[15px] font-semibold text-fg">{event.title}</p>
                            <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} size="sm" />
                          </div>
                          {assigned.length ? (
                            <ul className="mt-3 flex flex-wrap gap-2">
                              {assigned.map((t) => (
                                <li key={t._id} className="flex items-center gap-1.5 rounded-full border border-line bg-canvas py-1 pl-3 pr-1 text-[13px] font-medium text-fg">
                                  {t.name}
                                  <IconButton size="sm" label={`Remove ${t.name} from ${event.title}`} icon={X} onClick={() => setRemoving({ event, teacher: t })} className="size-6 rounded-full" />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 flex items-center gap-2 text-[13px] font-medium text-amber-700">
                              <AlertTriangle aria-hidden="true" className="size-3.5" /> No teacher yet — attendance can&apos;t be taken.
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setEventId(event._id); setPicked([]); }} className="hidden sm:inline-flex">
                          Add
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={Presentation} title="Nothing to staff yet" description="Upcoming and live events will appear here with their teachers." />
            )}
            {teachers.data && !teachers.data.length ? (
              <p className="mt-4">
                <Badge tone="warning">No active teachers</Badge>
                <span className="ml-2 text-[13px] text-muted">Teachers appear once an administrator approves their accounts.</span>
              </p>
            ) : null}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={unassign}
        loading={busy}
        title={`Remove ${removing?.teacher.name || "this teacher"}?`}
        confirmLabel="Remove teacher"
        description={`${removing?.teacher.name || "They"} will no longer be able to take attendance for ${removing?.event.title || "this event"}. They'll be notified.`}
      />
    </>
  );
}
