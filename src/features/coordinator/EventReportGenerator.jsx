"use client";

import { useState } from "react";
import { BookMarked, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import { Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage, getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import useResource from "@/hooks/useResource";
import { participantCount } from "./data";

// NSS runs on the academic year, which starts in June.
function academicYears(count = 4) {
  const now = new Date();
  const current = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, i) => current - i).map((y) => ({ value: y, label: `${y}–${String((y + 1) % 100).padStart(2, "0")}` }));
}

function saveBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function AnnualReport() {
  const years = academicYears();
  const [year, setYear] = useState(String(years[0].value));
  const [busy, setBusy] = useState(false);
  const label = years.find((y) => String(y.value) === year)?.label;

  const download = async () => {
    setBusy(true);
    try {
      const res = await api.get(`/api/nss/annual-report?year=${year}`, { responseType: "blob" });
      saveBlob(res.data, `NSS-Annual-Report-${label.replace("–", "-")}.pdf`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't build the annual report."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="annual-title" className="mb-8 flex flex-col gap-5 rounded-2xl bg-ink p-6 text-on-dark sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p id="annual-title" className="eyebrow flex items-center gap-2 text-on-dark/55">
          <BookMarked aria-hidden="true" className="size-3.5 text-brand" /> Annual report
        </p>
        <p className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">The whole year, ready to file</p>
        <p className="mt-1 text-[14px] leading-relaxed text-on-dark/60">
          Drives, volunteer hours, special camps, community impact, certificate-eligible volunteers and donations, in one PDF for the university and NAAC.
        </p>
      </div>
      <div className="flex items-end gap-2">
        <Select label="Academic year" value={year} onChange={(e) => setYear(e.target.value)} containerClassName="w-36 [&_label]:text-on-dark/70">
          {years.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </Select>
        <Button variant="light" icon={Download} loading={busy} onClick={download}>
          Download
        </Button>
      </div>
    </section>
  );
}

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

      <AnnualReport />

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
