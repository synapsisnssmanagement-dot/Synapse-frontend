"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { sortEvents, useMyEvents } from "./data";

export default function GeneratePdfTeacher() {
  const events = useMyEvents();
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () => sortEvents((events.data || []).filter((e) => e.status !== "Cancelled" && (!q || e.title.toLowerCase().includes(q)))),
    [events.data, q]
  );

  const download = async (event) => {
    setDownloadingId(event._id);
    try {
      const res = await api.get(`/api/teacher/attendance/pdf/${event._id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.title.replace(/[^\w\- ]+/g, "").trim() || "event"}_attendance.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't generate that PDF."));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Attendance reports"
        description="A printable attendance record for any of your events."
        actions={rows.length ? <SearchInput value={query} onChange={setQuery} placeholder="Search events" className="w-64" /> : null}
      />

      {events.loading ? (
        <CardGridSkeleton count={4} className="xl:grid-cols-2" />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : rows.length ? (
        <ul className="grid gap-3 xl:grid-cols-2">
          {rows.map((event) => (
            <li key={event._id} className="flex items-center gap-4 rounded-xl border border-line bg-paper p-4">
              <DateBlock date={event.date} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-fg">{event.title}</p>
                <p className="mt-1 text-[13px] text-muted">
                  {formatDate(event.date)} · {event.location || "No location"}
                </p>
              </div>
              <Button size="sm" variant="outline" icon={Download} loading={downloadingId === event._id} onClick={() => download(event)}>
                PDF
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={FileText} title={q ? "No matches" : "No events yet"} description={q ? "Try a different name." : "Reports become available once you're assigned to an event."} />
      )}
    </>
  );
}
