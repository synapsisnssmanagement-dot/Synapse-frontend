"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, CheckCircle2, Circle, LocateFixed, MapPin, MapPinOff, Maximize2, Minimize2, Radio } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useSocket } from "@/context/SocketContext";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate, photoOf } from "@/lib/format";

const RADII = [100, 200, 300, 500, 1000];

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser can't share its location."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Allow location access for this site, then try again.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function VenuePin({ event, onSaved }) {
  const [radius, setRadius] = useState(String(event.geo?.radius || 300));
  const [busy, setBusy] = useState(false);
  const pinned = event.geo?.lat != null;

  const save = async (geo) => {
    setBusy(true);
    try {
      const res = await api.put(`/api/nss/events/${event._id}/extras`, { geo });
      onSaved(res.data?.event?.geo || null);
      toast.success(geo ? "Venue pinned. Check-ins now need to be on site." : "Location check turned off.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save the venue."));
    } finally {
      setBusy(false);
    }
  };

  const pinHere = async () => {
    try {
      const here = await locate();
      await save({ ...here, radius: Number(radius) });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
        {pinned ? <LocateFixed aria-hidden="true" className="size-4 text-brand" /> : <MapPinOff aria-hidden="true" className="size-4 text-on-dark/50" />}
        {pinned ? `Location check on · within ${event.geo.radius} m` : "Location check off"}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-on-dark/55">
        {pinned ? "Scans from farther away are refused, so nobody checks in absent friends." : "Stand at the venue and pin it so check-ins only count on site."}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Select label="Radius" value={radius} onChange={(e) => setRadius(e.target.value)} containerClassName="w-28 [&_label]:text-on-dark/70">
          {RADII.map((r) => (
            <option key={r} value={r}>
              {r} m
            </option>
          ))}
        </Select>
        <Button size="sm" variant="light" icon={MapPin} loading={busy} onClick={pinHere}>
          {pinned ? "Re-pin here" : "Pin venue here"}
        </Button>
        {pinned ? (
          <Button size="sm" variant="ghost" className="text-on-dark/70 hover:text-white" disabled={busy} onClick={() => save(null)}>
            Turn off
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function LiveEvent({ role }) {
  const { eventId } = useParams();
  const socket = useSocket();
  const resource = useResource(() => api.get(`/api/nss/events/${eventId}/live`).then((res) => res.data?.event), [eventId]);
  const [qr, setQr] = useState(null);
  const [recent, setRecent] = useState(null);
  const [full, setFull] = useState(false);
  const stageRef = useRef(null);
  const { mutate } = resource;
  const event = resource.data;
  const back = role === "teacher" ? "/teacherLayout/attendanceByTeacher" : "/coordinatorlayout/myevents";

  useEffect(() => {
    if (!eventId) return;
    QRCode.toDataURL(`${window.location.origin}/studentlayout/checkin/${eventId}`, { width: 520, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [eventId]);

  useEffect(() => {
    if (!socket) return undefined;
    const onAttendance = (payload) => {
      if (payload?.eventId !== eventId) return;
      mutate((current) => {
        if (!current) return current;
        const attendance = [...(current.attendance || [])];
        for (const u of payload.updates || []) {
          const i = attendance.findIndex((a) => String(a.student) === u.studentId);
          if (i >= 0) attendance[i] = { ...attendance[i], status: u.status, date: u.at };
          else attendance.push({ student: u.studentId, status: u.status, date: u.at });
        }
        return { ...current, attendance };
      });
      const first = payload.updates?.find((u) => u.status === "Present");
      if (first && payload.updates.length === 1) setRecent({ id: first.studentId, at: Date.now() });
    };
    const onStatus = (payload) => {
      if (payload?.eventId === eventId) mutate((current) => (current ? { ...current, status: payload.status } : current));
    };
    socket.on("event:attendance", onAttendance);
    socket.on("event:status", onStatus);
    return () => {
      socket.off("event:attendance", onAttendance);
      socket.off("event:status", onStatus);
    };
  }, [socket, eventId, mutate]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const statusOf = useMemo(() => {
    const map = new Map();
    for (const a of event?.attendance || []) map.set(String(a.student?._id || a.student), a);
    return map;
  }, [event]);

  if (resource.loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Skeleton className="h-[34rem] w-full" />
        <Skeleton className="h-[34rem] w-full" />
      </div>
    );
  }
  if (resource.status === "error" || !event) {
    return <ErrorState title="We couldn't open this event" error={resource.error} onRetry={resource.reload} />;
  }

  const roster = (event.participants || []).filter((p) => p && typeof p === "object");
  const present = roster.filter((p) => statusOf.get(String(p._id))?.status === "Present");
  const recentName = recent && roster.find((p) => String(p._id) === recent.id)?.name;
  const sorted = [...roster].sort((a, b) => {
    const pa = statusOf.get(String(a._id))?.status === "Present";
    const pb = statusOf.get(String(b._id))?.status === "Present";
    if (pa !== pb) return pa ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageRef.current?.requestFullscreen?.();
  };

  return (
    <div ref={stageRef} className={cx(full && "overflow-y-auto bg-canvas p-6")}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button href={back} variant="ghost" size="sm" icon={ArrowLeft} className="-ml-2 text-muted">
          Back
        </Button>
        <Button variant="outline" size="sm" icon={full ? Minimize2 : Maximize2} onClick={toggleFull}>
          {full ? "Exit full screen" : "Project on a screen"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-label="Check-in" className="flex flex-col rounded-2xl bg-ink p-6 text-on-dark">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} />
            {event.type === "special_camp" ? <Badge tone="live">Special camp</Badge> : null}
          </div>
          <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">{event.title}</h1>
          <p className="mt-1 text-[13.5px] text-on-dark/60">
            {formatDate(event.date, "long")} · {event.location}
          </p>

          <div className="mt-6 rounded-xl bg-white p-4">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated data URL
              <img src={qr} alt="QR code volunteers scan to check in" className="mx-auto aspect-square w-full max-w-72" />
            ) : (
              <Skeleton className="mx-auto aspect-square w-full max-w-72" />
            )}
          </div>
          <p className="mt-3 text-center text-[13px] text-on-dark/60">
            {event.status === "Ongoing" ? "Scan to check in. Only volunteers on this event are counted." : "Check-in opens when the event is started."}
          </p>

          {role === "coordinator" ? (
            <div className="mt-6">
              <VenuePin event={event} onSaved={(geo) => mutate((current) => ({ ...current, geo: geo || {} }))} />
            </div>
          ) : event.geo?.lat != null ? (
            <p className="mt-6 flex items-center gap-2 text-[13px] text-on-dark/70">
              <LocateFixed aria-hidden="true" className="size-4 text-brand" /> Location check on · within {event.geo.radius} m
            </p>
          ) : null}
        </section>

        <section aria-label="Attendance" className="min-w-0 rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow flex items-center gap-2 text-muted">
                <Radio aria-hidden="true" className={cx("size-3.5", socket ? "text-brand-700" : "text-subtle")} />
                {socket ? "Updating live" : "Connecting"}
              </p>
              <p className="tabular mt-2 text-[clamp(3rem,7vw,5rem)] font-semibold leading-none tracking-[-0.05em] text-ink">
                {present.length}
                <span className="text-[0.4em] font-medium tracking-normal text-subtle"> / {roster.length} here</span>
              </p>
            </div>
            <div aria-live="polite" className="min-h-6 text-[14px] font-medium text-brand-700">
              {recentName ? `${recentName} just checked in` : null}
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${roster.length ? (present.length / roster.length) * 100 : 0}%` }} />
          </div>

          {roster.length ? (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {sorted.map((p) => {
                const rec = statusOf.get(String(p._id));
                const here = rec?.status === "Present";
                const justNow = recent?.id === String(p._id);
                return (
                  <li
                    key={p._id}
                    className={cx(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors duration-500",
                      here ? "border-brand/30 bg-mint" : "border-line",
                      justNow && "ring-2 ring-brand"
                    )}
                  >
                    <Avatar src={photoOf(p)} name={p.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-fg">{p.name}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {here ? `Here${rec.date ? ` · ${formatDate(rec.date, "time")}` : ""}` : rec?.status === "Absent" ? "Marked absent" : "Not yet"}
                      </span>
                    </span>
                    {here ? (
                      <CheckCircle2 aria-label="Present" className="size-5 shrink-0 text-brand-700" />
                    ) : (
                      <Circle aria-label="Not checked in" className="size-5 shrink-0 text-line-strong" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 rounded-lg border border-dashed border-line-strong p-6 text-center text-[14px] text-muted">
              No volunteers are assigned to this event yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
