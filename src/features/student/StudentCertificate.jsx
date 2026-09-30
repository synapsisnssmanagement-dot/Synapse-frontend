"use client";

import { useState } from "react";
import { Download, MapPin, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/Logo";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { sortEvents, useMyEvents } from "./data";

export default function StudentCertificate() {
  const events = useMyEvents();
  const [downloadingId, setDownloadingId] = useState(null);
  const completed = sortEvents((events.data || []).filter((e) => e.status === "Completed"));

  const download = async (event) => {
    setDownloadingId(event._id);
    try {
      const res = await api.get(`/api/students/generate/${event._id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `NSS_Certificate_${event.title.replace(/[^\w\- ]+/g, "").trim() || "event"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      let message = "We couldn't generate that certificate.";
      if (error.response?.data instanceof Blob) {
        try {
          message = JSON.parse(await error.response.data.text()).message || message;
        } catch {
          // Keep the default message.
        }
      } else {
        message = errorMessage(error, message);
      }
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Recognition" title="Certificates" description="A signed certificate for every completed event you took part in." />
      {events.loading ? (
        <CardGridSkeleton count={3} />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : completed.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {completed.map((event) => (
            <li key={event._id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper">
              <div className="relative flex aspect-[1.414/1] flex-col justify-between border-b border-line bg-canvas p-6">
                <div aria-hidden="true" className="absolute inset-3 rounded-sm border border-ink/15" />
                <div className="relative flex items-center justify-between">
                  <LogoMark className="size-7 text-ink" />
                  <span className="eyebrow text-[0.6rem] text-muted">Certificate of service</span>
                </div>
                <div className="relative">
                  <p className="font-display text-2xl leading-tight text-ink">{event.title}</p>
                  <p className="mt-2 text-[12.5px] text-muted">
                    {formatDate(event.date, "long")} · {event.calculatedHours || event.hours} hours
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-[13px] text-muted">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" /> {event.location || "—"}
                </span>
                <Button size="sm" icon={Download} loading={downloadingId === event._id} onClick={() => download(event)}>
                  Download
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ScrollText} title="No certificates yet" description="Certificates become available once an event you attended is completed." />
      )}
    </>
  );
}
