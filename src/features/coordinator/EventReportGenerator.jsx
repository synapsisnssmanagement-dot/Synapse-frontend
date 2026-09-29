"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage, getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import useResource from "@/hooks/useResource";
import { participantCount } from "./data";

export default function EventReportGenerator() {
  const events = useResource(
    () => getList("/api/coordinator/events", "events").then((list) => list.filter((e) => e.status === "Completed")),
    []
  );
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const q = query.trim().toLowerCase();
  const rows = (events.data || []).filter((e) => !q || e.title.toLowerCase().includes(q));

  const download = async (event) => {
    setDownloadingId(event._id);
    try {
      const res = await api.post(`/api/coordinator/pdfgeneration/${event._id}`, {}, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.title.replace(/[^\w\- ]+/g, "").trim() || "event"}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't generate that report."));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Event reports"
        description="A PDF attendance report for any completed event — participant list, department and total volunteer count."
        actions={rows.length ? <SearchInput value={query} onChange={setQuery} placeholder="Search completed events" className="w-64" /> : null}
      />

      {events.loading ? (
        <CardGridSkeleton count={4} className="xl:grid-cols-2" />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : rows.length ? (
        <ul className="grid gap-3 xl:grid-cols-2">
          {rows.map((event) => (
            <li
              key={event._id}
              className={cx("flex items-center gap-4 rounded-xl border border-line bg-paper p-4", downloadingId === event._id && "opacity-80")}
            >
              <DateBlock date={event.date} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-fg">{event.title}</p>
                <p className="mt-1 text-[13px] text-muted">
                  {formatDate(event.date)} · {participantCount(event)} participants
                </p>
              </div>
              <Button size="sm" variant="outline" icon={Download} loading={downloadingId === event._id} onClick={() => download(event)}>
                PDF
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={FileText}
          title={q ? "No matches" : "No completed events yet"}
          description={q ? "Try a different name." : "Reports become available once you complete an event."}
        />
      )}
    </>
  );
}
