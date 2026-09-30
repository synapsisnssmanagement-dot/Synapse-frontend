"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Clock3, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import { Drawer } from "@/components/ui/Dialog";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { sortEvents } from "./data";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "Ongoing", label: "Live" },
  { id: "Completed", label: "Completed" },
];

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export default function StudentMyEvents() {
  const tabsId = useId();
  const events = useResource(() => api.get("/api/students/events/filter").then((res) => res.data?.events || []), []);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const all = useMemo(() => events.data || [], [events.data]);
  const counts = useMemo(() => {
    const out = { all: all.length, Upcoming: 0, Ongoing: 0, Completed: 0 };
    all.forEach((e) => {
      if (out[e.status] != null) out[e.status] += 1;
    });
    return out;
  }, [all]);

  const q = query.trim().toLowerCase();
  const rows = sortEvents(all.filter((e) => (filter === "all" || e.status === filter) && (!q || `${e.title} ${e.location}`.toLowerCase().includes(q))));
  const open = all.find((e) => e.id === openId) || null;

  return (
    <>
      <PageHeader eyebrow="Service" title="My events" description="Every drive you've been part of, and the ones coming up." />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Tabs id={tabsId} value={filter} onChange={setFilter} label="Filter events" tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} className="flex-1" />
        <SearchInput value={query} onChange={setQuery} placeholder="Search events" className="w-full lg:w-72" />
      </div>

      <div {...tabPanelProps(tabsId, filter)}>
        {events.loading ? (
          <CardGridSkeleton count={4} />
        ) : events.status === "error" ? (
          <ErrorState error={events.error} onRetry={events.reload} />
        ) : rows.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(event.id)}
                  className="flex h-full w-full flex-col rounded-xl border border-line bg-paper p-5 text-left transition-colors hover:border-ink"
                >
                  <div className="flex items-start gap-3">
                    <DateBlock date={event.date} size="sm" />
                    <div className="min-w-0 flex-1">
                      <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} size="sm" />
                      <p className="mt-2 text-[15px] font-semibold leading-snug text-fg">{event.title}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
                    <li className="flex items-center gap-2">
                      <MapPin aria-hidden="true" className="size-3.5" /> {event.location || "No location"}
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock3 aria-hidden="true" className="size-3.5" /> {event.hours} hours
                    </li>
                  </ul>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarRange}
            title={q ? "No matches" : "No events here"}
            description={q ? "Try a different name or place." : "When a coordinator adds you to a drive, it appears here."}
          />
        )}
      </div>

      <Drawer open={Boolean(open)} onClose={() => setOpenId(null)} eyebrow="Event" title={open?.title || ""} size="lg">
        {open ? (
          <div className="space-y-8">
            <StatusBadge status={open.status} label={open.status === "Ongoing" ? "Live" : undefined} />
            <ul className="space-y-2.5 text-[14.5px] text-fg-2">
              <li className="flex items-center gap-3">
                <CalendarDays aria-hidden="true" className="size-4 text-subtle" /> {formatDate(open.date, "long")}
              </li>
              <li className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="size-4 text-subtle" /> {open.location || "No location"}
              </li>
              <li className="flex items-center gap-3">
                <Clock3 aria-hidden="true" className="size-4 text-subtle" /> {open.hours} hours planned
              </li>
            </ul>
            {open.description ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg-2">{open.description}</p> : null}
            {[
              ["Teachers", asList(open.teacher)],
              ["Coordinator", asList(open.coordinator)],
            ].map(([label, people]) =>
              people.length ? (
                <section key={label}>
                  <h3 className="eyebrow mb-3 text-muted">{label}</h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {people.map((p) => (
                      <li key={p.id} className="rounded-lg border border-line p-3">
                        <Identity name={p.name} email={p.email} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null
            )}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
