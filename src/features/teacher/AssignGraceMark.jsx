"use client";

import { useMemo, useState } from "react";
import { Award, CalendarRange, Check, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Avatar from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { sortEvents, useMyEvents } from "./data";

const MAX_MARKS = 100;

function existingMark(student, eventId) {
  const record = student.graceHistory?.find((h) => String(h.eventId?._id || h.eventId) === String(eventId));
  return record ? record.marks : null;
}

export default function AssignGraceMark() {
  const events = useMyEvents();
  const [eventId, setEventId] = useState("");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(null);
  const [removing, setRemoving] = useState(null);

  const completed = useMemo(() => sortEvents((events.data || []).filter((e) => e.status === "Completed")), [events.data]);
  const participants = useResource(
    () => api.get(`/api/teacher/participantsofevents/${eventId}`).then((res) => res.data?.participants || []),
    [eventId],
    { enabled: Boolean(eventId) }
  );

  const people = participants.data || [];
  const q = query.trim().toLowerCase();
  const visible = q ? people.filter((s) => `${s.name} ${s.department || ""}`.toLowerCase().includes(q)) : people;

  const draftFor = (student) => (drafts[student._id] ?? existingMark(student, eventId) ?? "");

  const apply = async (student) => {
    const value = Number(draftFor(student));
    if (!Number.isFinite(value) || value <= 0 || value > MAX_MARKS) {
      toast.warn(`Enter marks between 1 and ${MAX_MARKS}.`);
      return;
    }
    const already = existingMark(student, eventId) != null;
    setBusy(student._id);
    try {
      if (already) {
        await api.put(`/api/teacher/update/${student._id}/${eventId}`, { marks: value });
      } else {
        await api.post("/api/teacher/grace-marks", { studentId: student._id, eventId, marks: value });
      }
      participants.mutate((list) =>
        (list || []).map((s) =>
          s._id === student._id
            ? { ...s, graceHistory: already ? s.graceHistory.map((h) => (String(h.eventId?._id || h.eventId) === eventId ? { ...h, marks: value } : h)) : [...(s.graceHistory || []), { eventId, marks: value }] }
            : s
        )
      );
      toast.success(`${already ? "Updated" : "Assigned"} ${value} marks for ${student.name}.`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save those marks."));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const student = removing;
    setBusy(student._id);
    try {
      await api.delete(`/api/teacher/delete/${student._id}/${eventId}`);
      participants.mutate((list) => (list || []).map((s) => (s._id === student._id ? { ...s, graceHistory: (s.graceHistory || []).filter((h) => String(h.eventId?._id || h.eventId) !== eventId) } : s)));
      setDrafts((prev) => ({ ...prev, [student._id]: "" }));
      toast.success(`Removed grace marks for ${student.name}.`);
      setRemoving(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't remove those marks."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Recognition" title="Assign grace marks" description="Award grace marks directly for a completed event you supervised." />

      {events.loading ? (
        <Skeleton className="h-11 w-full max-w-md" />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : completed.length ? (
        <Select label="Completed event" className="max-w-md" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Choose a completed event">
          {completed.map((e) => (
            <option key={e._id} value={e._id}>
              {e.title} — {formatDate(e.date, "short")}
            </option>
          ))}
        </Select>
      ) : (
        <EmptyState icon={CalendarRange} title="No completed events yet" description="Grace marks can be assigned once an event you supervised is complete." />
      )}

      {eventId ? (
        <div className="mt-6">
          {participants.loading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : participants.status === "error" ? (
            <ErrorState error={participants.error} onRetry={participants.reload} />
          ) : people.length ? (
            <div className="overflow-hidden rounded-xl border border-line bg-paper">
              <div className="border-b border-line p-4">
                <SearchInput value={query} onChange={setQuery} placeholder="Search students" className="max-w-xs" />
              </div>
              <ul className="divide-y divide-line">
                {visible.map((student) => {
                  const has = existingMark(student, eventId) != null;
                  return (
                    <li key={student._id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
                      <Avatar name={student.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium text-fg">{student.name}</span>
                        <span className="block truncate text-[12.5px] text-muted">{student.department || student.email}</span>
                      </span>
                      {has ? <Badge tone="success">Assigned</Badge> : null}
                      <input
                        type="number"
                        min={1}
                        max={MAX_MARKS}
                        value={draftFor(student)}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [student._id]: e.target.value }))}
                        aria-label={`Marks for ${student.name}`}
                        placeholder="Marks"
                        className="tabular h-10 w-24 rounded-lg border border-line bg-paper px-3 text-[14px] focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand/15"
                      />
                      <Button size="sm" icon={Check} loading={busy === student._id} onClick={() => apply(student)}>
                        {has ? "Update" : "Assign"}
                      </Button>
                      {has ? (
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setRemoving(student)} aria-label={`Remove grace marks for ${student.name}`} className="hover:bg-red-50 hover:text-red-600" />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <EmptyState icon={Award} title="No students to award" description="Nobody has attended this event yet." />
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy === removing?._id}
        title={`Remove grace marks for ${removing?.name || "this student"}?`}
        confirmLabel="Remove marks"
        description="Their total grace marks will be recalculated without this event."
      />
    </>
  );
}
