"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, LocateFixed, LogIn, LogOut, MapPin, MapPinOff, Radio, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { locate } from "./VenueSetup";

const VenueMap = dynamic(() => import("./VenueMap"), { ssr: false, loading: () => <div className="h-[220px] animate-pulse rounded-xl bg-mist" /> });

const metres = (a, b) => {
  const R = 6371000;
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};
const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);
const time = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

function EventCard({ ev, onDone }) {
  const [you, setYou] = useState(null);
  const [busy, setBusy] = useState(false);
  const [far, setFar] = useState(null); // { distance } when outside the range
  const venue = ev.geo?.lat != null ? { lat: ev.geo.lat, lng: ev.geo.lng } : null;
  const rec = ev.record;
  const distance = you && venue ? metres(you, venue) : null;
  const inside = distance != null && distance <= (ev.geo.radius || 300) + Math.min(you.accuracy || 0, 200);

  const send = async (action, pos, locationError) => {
    setBusy(true);
    try {
      const body = { event: ev._id, ...(pos ? { lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy } : { locationError }) };
      const r = await api.post(`/api/ops/attendance/self/${action}`, body);
      if (action === "in") toast.success(r.data.needsSupervisor ? "Checked in. A teacher will verify it because your location couldn't confirm you're on site." : "Checked in. A teacher will verify your attendance.");
      else toast.success(`Checked out after ${r.data.record.minutes} minutes.`);
      setFar(null);
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const checkIn = async (force = false) => {
    let pos = you;
    if (!force) {
      setBusy(true);
      try {
        pos = await locate();
        setYou(pos);
      } catch (e) {
        setBusy(false);
        if (!venue) return send("in", null, e.message);
        setFar({ error: e.message });
        return;
      }
      setBusy(false);
      if (venue) {
        const d = metres(pos, venue);
        if (d > (ev.geo.radius || 300) + Math.min(pos.accuracy || 0, 200)) {
          setFar({ distance: d });
          return;
        }
      }
    }
    await send("in", pos, far?.error);
  };

  const checkOut = async () => {
    let pos = null;
    try {
      pos = await locate();
      setYou(pos);
    } catch {
      // checking out without location is fine
    }
    await send("out", pos);
  };

  return (
    <Panel
      title={ev.title}
      description={ev.location}
      actions={
        <Badge tone="live">
          <span aria-hidden="true" className="mr-0.5 size-1.5 animate-pulse rounded-full bg-brand" /> Live
        </Badge>
      }
    >
      <div className="grid gap-4">
        {venue ? (
          <VenueMap center={venue} radius={ev.geo.radius} you={you} height={220} label={`Map of ${ev.title} venue`} />
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-canvas p-3 text-[13px] text-muted">
            <MapPinOff aria-hidden="true" className="size-4" /> No venue pin set for this activity, so your location isn&apos;t checked.
          </p>
        )}

        {distance != null ? (
          <p className={`flex items-center gap-2 text-[13.5px] font-medium ${inside ? "text-brand-700" : "text-amber-700"}`} role="status">
            {inside ? <CheckCircle2 aria-hidden="true" className="size-4" /> : <TriangleAlert aria-hidden="true" className="size-4" />}
            You are {fmtDist(distance)} from the venue {inside ? "— within range" : `— outside the ${fmtDist(ev.geo.radius)} range`}
            {you?.accuracy ? <span className="font-normal text-muted">(GPS ±{you.accuracy} m)</span> : null}
          </p>
        ) : null}

        {rec?.checkInAt ? (
          <div className="grid gap-1 rounded-lg border border-line p-3 text-[13.5px]">
            <p className="flex items-center gap-2 font-semibold text-fg">
              <Clock3 aria-hidden="true" className="size-4 text-brand-700" />
              Checked in at {time(rec.checkInAt)}
              {rec.checkOutAt ? ` · out at ${time(rec.checkOutAt)} (${rec.minutes} min)` : ""}
            </p>
            <p className="text-[12.5px] text-muted">{rec.verification === "verified" ? "Verified by a teacher." : "Waiting for a teacher to verify."}</p>
          </div>
        ) : null}

        {far ? (
          <div className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900" role="alert">
            <p className="font-semibold">{far.error ? "We couldn't get your location." : `You seem to be ${fmtDist(far.distance)} away — outside the check-in range.`}</p>
            <p>{far.error ? far.error : "If you are at the venue, GPS may be inaccurate indoors. Move outside or near a window and try again."} You can still check in; a teacher will verify it.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" icon={LocateFixed} onClick={() => checkIn(false)} loading={busy}>
                Try again
              </Button>
              <Button size="sm" variant="dark" onClick={() => checkIn(true)} loading={busy}>
                Check in anyway
              </Button>
            </div>
          </div>
        ) : null}

        {!rec?.checkInAt ? (
          <Button size="lg" fullWidth icon={LogIn} loading={busy && !far} onClick={() => checkIn(false)}>
            Check in
          </Button>
        ) : !rec.checkOutAt ? (
          <Button size="lg" fullWidth variant="dark" icon={LogOut} loading={busy} onClick={checkOut}>
            Check out
          </Button>
        ) : (
          <p className="flex items-center justify-center gap-2 rounded-lg bg-mint p-3 text-[14px] font-semibold text-brand-700">
            <CheckCircle2 aria-hidden="true" className="size-4" /> Done for today
          </p>
        )}
        <p className="flex items-center gap-1.5 text-[12px] text-muted">
          <MapPin aria-hidden="true" className="size-3.5" /> Your location is used only for this check-in and stored roughly (about 100 m).
        </p>
      </div>
    </Panel>
  );
}

export default function VolunteerCheckIn() {
  const live = useResource(() => api.get("/api/ops/attendance/live").then((r) => r.data.events), []);
  return (
    <>
      <PageHeader eyebrow="Service" title="Check in" description="Check in when you arrive at a live activity and check out when you leave. No QR code needed." />
      {live.status === "error" ? (
        <ErrorState error={live.error} onRetry={live.reload} />
      ) : !live.data ? (
        <CardGridSkeleton count={2} />
      ) : live.data.length ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {live.data.map((ev) => (
            <EventCard key={ev._id} ev={ev} onDone={live.reload} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Radio} title="No live activities right now" description="An activity appears here once your coordinator starts it and you're on its volunteer list." action={<Button variant="outline" onClick={live.reload}>Refresh</Button>} />
      )}
    </>
  );
}
