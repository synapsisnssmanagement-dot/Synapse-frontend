"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { CloudOff, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/States";
import api, { errorMessage, getList } from "@/lib/api";
import useResource from "@/hooks/useResource";
import { formatDate } from "@/lib/format";
import { clearSynced, enqueue, findRoster, getOnline, getOnlineServer, getServerSnapshot, getSnapshot, loadQueue, loadRosters, markStates, recoverInterrupted, saveRoster, setSyncing, subscribe, subscribeOnline } from "./offlineQueue";

const STATE_TONE = { queued: ["neutral", "Queued"], syncing: ["info", "Syncing"], synced: ["success", "Synced"], conflict: ["danger", "Conflict — review"], error: ["danger", "Error"] };

// Supervisor-managed capture. Works without a connection: marks are queued on
// this device and sent with client operation ids, so resending is safe.
export default function FieldAttendance() {
  const events = useResource(() => getList("/api/ops/attendance/activities", "events"), []);
  const [eventId, setEventId] = useState("");
  const [date, setDate] = useState("");
  const [roster, setRoster] = useState(null);
  const queue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const online = useSyncExternalStore(subscribeOnline, getOnline, getOnlineServer);
  const [syncing, setSyncingFlag] = useState(false);
  const [marks, setMarks] = useState({});
  const recovered = useRef(false);

  // Register the field-attendance service worker (page shell + static assets only).
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/field-sw.js").catch(() => {});
  }, []);

  const applyRoster = (r) => {
    setRoster(r);
    setDate(r.sessionDate);
    const m = {};
    for (const rec of r.records) m[rec.student] = { status: rec.status, checkIn: rec.checkInAt?.slice(11, 16) || "", checkOut: rec.checkOutAt?.slice(11, 16) || "", rev: rec.rev };
    // Marks still queued on this device take precedence in the display.
    for (const o of loadQueue().filter((x) => x.event === r.event._id && x.sessionDate === r.sessionDate && x.state !== "synced")) {
      m[o.student] = { ...(m[o.student] || {}), status: o.status, checkIn: o.checkInAt?.slice(11, 16) || m[o.student]?.checkIn || "", checkOut: o.checkOutAt?.slice(11, 16) || m[o.student]?.checkOut || "" };
    }
    setMarks(m);
  };

  const loadRoster = async () => {
    if (!eventId) return;
    try {
      const r = (await api.get("/api/ops/attendance/roster", { params: { event: eventId, date: date || undefined } })).data;
      saveRoster(r);
      applyRoster(r);
    } catch (e) {
      const cached = findRoster(eventId, date || undefined);
      if (cached) {
        applyRoster(cached);
        toast.info(`Offline: using the roster saved on this device at ${new Date(cached.savedAt).toLocaleString()}.`);
      } else {
        toast.error(online ? errorMessage(e) : "You are offline and this roster was never loaded on this device. Load it once while connected.");
      }
    }
  };
  // Offline (list failed to load): offer the activities whose rosters are saved here.
  const activityOptions = events.status === "error" ? loadRosters().map((x) => x.event) : events.data || [];

  const sync = useCallback(async () => {
    const pending = loadQueue().filter((o) => o.state === "queued" || o.state === "error");
    if (!pending.length) return;
    setSyncingFlag(true);
    setSyncing(pending.map((o) => o.opId));
    try {
      for (let i = 0; i < pending.length; i += 100) {
        const batch = pending.slice(i, i + 100);
        const r = await api.post("/api/ops/attendance/sync", { ops: batch.map(({ state, label, ...o }) => o) });
        markStates(r.data.results);
      }
      toast.success("Attendance synced");
    } catch (e) {
      recoverInterrupted();
      toast.error(`Sync stopped: ${errorMessage(e)}. Your marks are still queued.`);
    } finally {
      setSyncingFlag(false);
    }
  }, []);

  // Interrupted syncs return to the queue once per page load; reconnecting
  // or new marks then trigger a sync (server dedupes by opId).
  useEffect(() => {
    if (!recovered.current) {
      recovered.current = true;
      recoverInterrupted();
    }
  }, []);
  useEffect(() => {
    if (!online || syncing || !queue.some((o) => o.state === "queued")) return undefined;
    const t = setTimeout(sync, 300);
    return () => clearTimeout(t);
  }, [online, queue, syncing, sync]);

  const mark = (s, status) => {
    const cur = { ...(marks[s._id] || {}), status };
    setMarks((m) => ({ ...m, [s._id]: cur }));
    const at = (t) => (t ? new Date(`${roster.sessionDate}T${t}:00`).toISOString() : null);
    try {
      
        enqueue({
          event: roster.event._id,
          student: s._id,
          label: s.name,
          sessionDate: roster.sessionDate,
          status,
          checkInAt: at(cur.checkIn),
          checkOutAt: at(cur.checkOut),
          baseRev: cur.rev ?? null,
          offline: !online,
        })
      ;
    } catch (e) {
      toast.error(e.message);
    }
  };
  const setTime = (id, k, v) => setMarks((m) => ({ ...m, [id]: { ...(m[id] || {}), [k]: v } }));

  const counts = queue.reduce((a, o) => ({ ...a, [o.state]: (a[o.state] || 0) + 1 }), {});
  return (
    <>
      <PageHeader
        eyebrow="Field"
        title="Field attendance"
        description="Mark volunteers on the spot, including those without a compatible phone. Works offline: marks are queued on this device and synced when you reconnect. Conflicting edits are kept for review, never overwritten."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={online ? "success" : "warning"} icon={online ? undefined : CloudOff}>
              {online ? "Online" : "Offline"}
            </Badge>
            <Button variant="outline" icon={RefreshCw} onClick={sync} loading={syncing} disabled={!online}>
              Sync now
            </Button>
          </div>
        }
      />
      <Panel className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <Select label="Activity" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Choose activity">
            {activityOptions.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title} — {formatDate(e.date)}
              </option>
            ))}
          </Select>
          <Input label="Session date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button variant="dark" onClick={loadRoster} disabled={!eventId}>
            Load roster
          </Button>
        </div>
      </Panel>

      {roster ? (
        <Panel title={`${roster.event.title} · ${roster.sessionDate}`} padded={false}>
          {roster.students.length ? (
            <ul>
              {roster.students.map((s) => {
                const m = marks[s._id] || {};
                return (
                  <li key={s._id} className="grid gap-2 border-b border-line px-5 py-3 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-medium text-fg">{s.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Input label="In" type="time" value={m.checkIn || ""} onChange={(e) => setTime(s._id, "checkIn", e.target.value)} containerClassName="w-28" />
                        <Input label="Out" type="time" value={m.checkOut || ""} onChange={(e) => setTime(s._id, "checkOut", e.target.value)} containerClassName="w-28" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={`Attendance for ${s.name}`}>
                      {["present", "partial", "absent", "excused"].map((st) => (
                        <Button key={st} size="sm" variant={m.status === st ? "dark" : "outline"} aria-pressed={m.status === st} onClick={() => mark(s, st)}>
                          {st[0].toUpperCase() + st.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={Users} title="No volunteers on this activity" />
          )}
        </Panel>
      ) : null}

      <Panel
        title="This device's queue"
        description={`Queued ${counts.queued || 0} · syncing ${counts.syncing || 0} · synced ${counts.synced || 0} · conflicts ${counts.conflict || 0} · errors ${counts.error || 0}`}
        className="mt-4"
        actions={
          <Button size="sm" variant="ghost" onClick={() => clearSynced()} disabled={!counts.synced}>
            Clear synced
          </Button>
        }
      >
        {queue.length ? (
          <ul className="grid gap-1 text-[13px]">
            {queue
              .slice()
              .reverse()
              .map((o) => {
                const [tone, label] = STATE_TONE[o.state] || ["neutral", o.state];
                return (
                  <li key={o.opId} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {o.label} · {o.sessionDate} · {o.status}
                      {o.message ? ` — ${o.message}` : ""}
                      {o.state === "conflict" ? ` — server has ${o.server?.status ?? "a newer version"}; resolve it under Attendance review.` : ""}
                    </span>
                    <Badge tone={tone}>{label}</Badge>
                  </li>
                );
              })}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">Nothing queued on this device.</p>
        )}
      </Panel>
    </>
  );
}
