"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import api, { errorMessage } from "@/lib/api";

export default function CheckIn() {
  const params = useParams();
  const eventId = params?.eventId;
  const [state, setState] = useState({ status: "loading", message: "", eventTitle: "" });

  useEffect(() => {
    if (!eventId) return;
    api
      .post(`/api/students/checkin/${eventId}`)
      .then((res) => setState({ status: "success", message: res.data?.message || "Checked in.", eventTitle: res.data?.eventTitle || "" }))
      .catch((error) => setState({ status: "error", message: errorMessage(error, "Check-in failed."), eventTitle: "" }));
  }, [eventId]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-8 text-center">
        {state.status === "loading" ? (
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
