"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { LocateFixed, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import api, { errorMessage } from "@/lib/api";

const VenueMap = dynamic(() => import("./VenueMap"), { ssr: false, loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-mist" /> });

export const locate = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject(new Error("This browser can't share its location."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      (err) => reject(new Error(err.code === 1 ? "Location permission was denied. Allow location for this site in your browser settings." : "We couldn't get your location. Move to an open area and try again.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

// Modal for coordinators: place the venue on a map and choose the check-in range.
export default function VenueSetup({ open, onClose, event, onSaved }) {
  const [point, setPoint] = useState(event?.geo?.lat != null ? { lat: event.geo.lat, lng: event.geo.lng } : null);
  const [radius, setRadius] = useState(event?.geo?.radius || 200);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const useMine = async () => {
    setLocating(true);
    try {
      const p = await locate();
      setPoint({ lat: p.lat, lng: p.lng });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLocating(false);
    }
  };
  const save = async (geo) => {
    setBusy(true);
    try {
      const res = await api.put(`/api/nss/events/${event._id}/extras`, { geo });
      onSaved?.(res.data?.event?.geo || null);
      toast.success(geo ? `Venue saved. Check-ins are expected within ${geo.radius} m.` : "Location check turned off.");
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "We couldn't save the venue."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Venue and check-in range"
      description="Tap the map or drag the pin to the venue, then choose how far away volunteers may check in from."
      size="lg"
      footer={
        <>
          {event?.geo?.lat != null ? (
            <Button variant="ghost" onClick={() => save(null)} disabled={busy}>
              Turn location check off
            </Button>
          ) : null}
          <Button variant="dark" icon={MapPin} loading={busy} disabled={!point} onClick={() => save({ ...point, radius })}>
            Save venue
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-muted">{point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : "No venue chosen yet — tap the map."}</p>
          <Button size="sm" variant="outline" icon={LocateFixed} loading={locating} onClick={useMine}>
            Use my current location
          </Button>
        </div>
        {open ? <VenueMap center={point} radius={radius} editable onMove={setPoint} height={340} label="Venue map: tap to place the venue" /> : null}
        <label className="grid gap-2">
          <span className="flex items-baseline justify-between text-[13.5px] font-semibold text-fg">
            Check-in range
            <span className="tabular text-[15px] text-brand-700">{radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}</span>
          </span>
          <input type="range" min={50} max={2000} step={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-[#047857]" aria-valuetext={`${radius} metres`} />
          <span className="flex justify-between text-[11.5px] text-subtle">
            <span>50 m</span>
            <span>2 km</span>
          </span>
        </label>
        <p className="rounded-lg bg-canvas p-3 text-[12.5px] leading-relaxed text-muted">
          Phone GPS can be off by tens of metres indoors. Check-ins from outside the circle are still recorded but marked for a teacher to verify; location is supporting evidence, not proof.
        </p>
      </div>
    </Modal>
  );
}
