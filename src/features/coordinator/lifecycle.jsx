"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { ConfirmDialog } from "@/components/ui/Dialog";
import api, { errorMessage } from "@/lib/api";
import { presentCount } from "./data";

// Start and complete an event. Completing credits hours to every volunteer marked
// present, so both steps are confirmed with their consequences spelled out.
export default function useEventLifecycle(onUpdated) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const { event, action } = pending;
    setBusy(true);
    try {
      const res = await api.put(`/api/events/${event._id}/${action}`, {});
      const updated = res.data?.event;
      onUpdated({
        ...event,
        ...(updated ? { status: updated.status, startTime: updated.startTime, endTime: updated.endTime, calculatedHours: updated.calculatedHours } : {}),
        status: action === "start" ? "Ongoing" : "Completed",
      });
      toast.success(action === "start" ? `${event.title} has started.` : `${event.title} is complete. Volunteer hours were credited.`);
      setPending(null);
    } catch (error) {
      toast.error(errorMessage(error, `We couldn't ${action} that event.`));
    } finally {
      setBusy(false);
    }
  };

  const present = pending ? presentCount(pending.event) : 0;
  const dialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      onClose={() => setPending(null)}
      onConfirm={run}
      loading={busy}
      tone="info"
      title={pending?.action === "start" ? `Start ${pending?.event.title}?` : `Complete ${pending?.event.title}?`}
      confirmLabel={pending?.action === "start" ? "Start event" : "Complete event"}
      description={
        pending?.action === "start"
          ? "The start time is recorded now and teachers can begin marking attendance. Hours are measured from this moment."
          : `The end time is recorded now and hours are credited to the ${present} ${present === 1 ? "volunteer" : "volunteers"} marked present. This can't be undone.`
      }
    />
  );

  return {
    start: (event) => setPending({ event, action: "start" }),
    complete: (event) => setPending({ event, action: "complete" }),
    dialog,
  };
}
