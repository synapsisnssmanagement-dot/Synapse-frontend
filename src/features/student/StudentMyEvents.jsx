"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, CheckCircle2, CircleDashed, Clock3, LayoutList, MapPin, NotebookPen, Tent, XCircle } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import { Drawer } from "@/components/ui/Dialog";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import MonthCalendar from "@/components/shared/MonthCalendar";
import { sortEvents } from "./data";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "Ongoing", label: "Live" },
  { id: "Completed", label: "Completed" },
];

const isCamp = (e) => e?.type === "special_camp";

function dateRange(e, style = "medium") {
  if (isCamp(e) && e.endDate) return `${formatDate(e.date, "short")} – ${formatDate(e.endDate, style)}`;
  return formatDate(e.date, style === "medium" ? "medium" : "long");
}

function CampBadge({ size }) {
  return (
    <Badge tone="dark" icon={Tent} size={size}>
      Special camp
    </Badge>
  );
}

const DAY_STATE = {
  present: { Icon: CheckCircle2, text: "Present", cls: "border-brand/25 bg-mint text-brand-700" },
  absent: { Icon: XCircle, text: "Absent", cls: "border-red-200 bg-red-50 text-red-700" },
  pending: { Icon: CircleDashed, text: "Not recorded", cls: "border-line bg-canvas text-muted" },
};

function CampSection({ eventId }) {
  const camp = useResource(() => api.get(`/api/nss/events/${eventId}/camp`).then((res) => res.data?.camp || null), [eventId]);

  if (camp.loading) {
    return (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading camp details</span>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (camp.status === "error") return <ErrorState size="sm" title="We couldn't load the camp" error={camp.error} onRetry={camp.reload} />;

  const days = camp.data?.days || [];
  const diary = [...(camp.data?.diary || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const attended = days.filter((d) => d.present === true).length;

  return (
    <>
      <section aria-labelledby="camp-days-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="camp-days-title" className="eyebrow text-muted">
            Camp attendance
          </h3>
          {days.length ? (
            <p className="tabular text-[13px] font-semibold text-fg">
              Attended {attended} of {days.length} days
            </p>
          ) : null}
        </div>
        {days.length ? (
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {days.map((d, i) => {
              const st = DAY_STATE[!d.recorded || d.present == null ? "pending" : d.present ? "present" : "absent"];
              return (
                <li key={d.date || i} className={cx("rounded-lg border px-3 py-2.5", st.cls)}>
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide opacity-80">Day {i + 1}</p>
                  <p className="text-[13px] font-semibold">{formatDate(d.date, "short")}</p>
                  <p className="mt-1 flex items-center gap-1 text-[12.5px]">
                    <st.Icon aria-hidden="true" className="size-3.5 shrink-0" /> {st.text}
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-[13.5px] text-muted">Camp days will appear here once the camp is scheduled.</p>
        )}
      </section>

      <section aria-labelledby="camp-diary-title">
        <h3 id="camp-diary-title" className="eyebrow mb-3 text-muted">
          Camp diary
        </h3>
        {diary.length ? (
          <ul className="space-y-3">
            {diary.map((entry) => (
              <li key={entry._id} className="rounded-lg border border-line p-4">
                <p className="text-[14.5px] font-semibold text-fg">{entry.title}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {entry.authorName ? `${entry.authorName} · ` : ""}
                  {formatDate(entry.date)}
                </p>
                {entry.body ? <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-fg-2">{entry.body}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState size="sm" icon={NotebookPen} title="No diary entries yet" description="Notes from each camp day are posted here by your coordinators." />
        )}
      </section>
    </>
  );
}

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export default function StudentMyEvents() {
  const tabsId = useId();
  const events = useResource(() => api.get("/api/students/events/filter").then((res) => res.data?.events || []), []);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState("list");

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
        <div className="flex items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Search events" className="w-full lg:w-72" />
          <div className="flex shrink-0 gap-1 rounded-lg border border-line p-1">
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cx("flex size-8 items-center justify-center rounded-md transition-colors", view === "list" ? "bg-ink text-white" : "text-fg-2 hover:bg-mist")}
              aria-label="List view"
            >
              <LayoutList aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
              className={cx("flex size-8 items-center justify-center rounded-md transition-colors", view === "calendar" ? "bg-ink text-white" : "text-fg-2 hover:bg-mist")}
              aria-label="Calendar view"
            >
              <CalendarDays aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div {...tabPanelProps(tabsId, filter)}>
        {events.loading ? (
          <CardGridSkeleton count={4} />
        ) : events.status === "error" ? (
          <ErrorState error={events.error} onRetry={events.reload} />
        ) : view === "calendar" ? (
          rows.length ? (
            <MonthCalendar events={rows} onSelectEvent={(e) => setOpenId(e.id)} />
          ) : (
            <EmptyState icon={CalendarRange} title={q ? "No matches" : "No events here"} description={q ? "Try a different name or place." : "When a coordinator adds you to a drive, it appears here."} />
          )
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
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} size="sm" />
                        {isCamp(event) ? <CampBadge size="sm" /> : null}
                      </div>
                      <p className="mt-2 text-[15px] font-semibold leading-snug text-fg">{event.title}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
                    {isCamp(event) && event.endDate ? (
                      <li className="flex items-center gap-2">
                        <CalendarRange aria-hidden="true" className="size-3.5" /> {dateRange(event)}
                      </li>
                    ) : null}
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
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={open.status} label={open.status === "Ongoing" ? "Live" : undefined} />
              {isCamp(open) ? <CampBadge /> : null}
            </div>
            <ul className="space-y-2.5 text-[14.5px] text-fg-2">
              <li className="flex items-center gap-3">
                <CalendarDays aria-hidden="true" className="size-4 text-subtle" /> {isCamp(open) && open.endDate ? dateRange(open, "long") : formatDate(open.date, "long")}
              </li>
              <li className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="size-4 text-subtle" /> {open.location || "No location"}
              </li>
              <li className="flex items-center gap-3">
                <Clock3 aria-hidden="true" className="size-4 text-subtle" /> {open.hours} hours planned
              </li>
            </ul>
            {open.description ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg-2">{open.description}</p> : null}
            {isCamp(open) ? <CampSection eventId={open.id} /> : null}
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
