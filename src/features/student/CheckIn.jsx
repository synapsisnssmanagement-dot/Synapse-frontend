"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarClock, CheckCircle2, LocateFixed, MapPinOff, RotateCw, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import api, { errorMessage } from "@/lib/api";

function getPosition() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export default function CheckIn() {
  const params = useParams();
  const eventId = params?.eventId;
  const [state, setState] = useState({ status: "locating", message: "", eventTitle: "" });
  const inFlight = useRef(false);

  const attempt = useCallback(async () => {
    if (!eventId || inFlight.current) return;
    inFlight.current = true;
    setState({ status: "locating", message: "", eventTitle: "" });
    try {
      const coords = await getPosition();
      setState((s) => ({ ...s, status: "loading" }));
      const res = await api.post(`/api/students/checkin/${eventId}`, coords || {});
      setState({ status: "success", message: res.data?.message || "Checked in.", eventTitle: res.data?.eventTitle || "" });
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "LOCATION_REQUIRED") {
        setState({
          status: "location",
          message: "This event checks that you're at the venue. Allow location access for this site in your browser, then try again.",
          eventTitle: "",
        });
      } else if (code === "TOO_FAR") {
        setState({ status: "far", message: errorMessage(error, "You seem to be too far from the venue."), eventTitle: "" });
      } else {
        setState({ status: "error", message: errorMessage(error, "Check-in failed."), eventTitle: "" });
      }
    } finally {
      inFlight.current = false;
    }
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the async check-in; the ref guard dedupes StrictMode's double run
    attempt();
  }, [attempt]);

  const retry = (
    <Button icon={RotateCw} onClick={attempt} className="mt-5">
      Try again
    </Button>
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div aria-live="polite" className="w-full max-w-sm rounded-2xl border border-line bg-paper p-8 text-center">
        {state.status === "locating" ? (
          <>
            <LocateFixed aria-hidden="true" className="mx-auto size-10 animate-pulse text-subtle" />
            <p className="mt-4 text-[15px] font-semibold text-fg">Finding your location&hellip;</p>
            <p className="mt-2 text-[13.5px] text-muted">Some events confirm you&apos;re at the venue.</p>
          </>
        ) : state.status === "loading" ? (
          <>
            <CalendarClock aria-hidden="true" className="mx-auto size-10 animate-pulse text-subtle" />
            <p className="mt-4 text-[15px] font-semibold text-fg">Checking you in&hellip;</p>
          </>
        ) : state.status === "success" ? (
          <>
            <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-brand-700" />
            <p className="mt-4 text-[17px] font-semibold text-fg">You&apos;re checked in</p>
            <p className="mt-2 text-[13.5px] text-muted">{state.message}</p>
          </>
        ) : state.status === "location" ? (
          <>
            <MapPinOff aria-hidden="true" className="mx-auto size-10 text-amber-700" />
            <p className="mt-4 text-[17px] font-semibold text-fg">Location access needed</p>
            <p className="mt-2 text-[13.5px] text-muted">{state.message}</p>
            {retry}
          </>
        ) : state.status === "far" ? (
          <>
            <MapPinOff aria-hidden="true" className="mx-auto size-10 text-red-600" />
            <p className="mt-4 text-[17px] font-semibold text-fg">You&apos;re not at the venue yet</p>
            <p className="mt-2 text-[13.5px] text-muted">{state.message}</p>
            {retry}
          </>
        ) : (
          <>
            <XCircle aria-hidden="true" className="mx-auto size-10 text-red-600" />
            <p className="mt-4 text-[17px] font-semibold text-fg">Couldn&apos;t check you in</p>
            <p className="mt-2 text-[13.5px] text-muted">{state.message}</p>
          </>
        )}
        <Button href="/studentlayout/studentevents" variant="outline" className="mt-6">
          Go to my events
        </Button>
      </div>
    </div>
  );
}
