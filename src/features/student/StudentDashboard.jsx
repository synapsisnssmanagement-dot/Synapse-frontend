"use client";

import Link from "next/link";
import { Award, CalendarRange, Clock3, MapPin, ScrollText, Trophy } from "lucide-react";
import { LevelBadge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateBlock from "@/components/ui/DateBlock";
import PageHeader, { Accent } from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import Progress from "@/components/ui/Progress";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { firstName, formatNumber, greeting } from "@/lib/format";
import { levelProgress, sortEvents, useStudentProfile } from "./data";

function Journey({ hours }) {
  const { current, next, pct } = levelProgress(hours);
  return (
    <section aria-labelledby="journey-title" className="flex flex-col justify-between rounded-2xl bg-ink p-6 text-on-dark sm:p-7">
      <div>
        <p id="journey-title" className="eyebrow text-on-dark/55">
          Hours credited
        </p>
        <p className="tabular mt-5 text-[clamp(3.25rem,6vw,4.75rem)] font-semibold leading-none tracking-[-0.05em] text-brand">
          {formatNumber(Math.round(hours * 10) / 10)}
          <span className="ml-2 text-lg font-medium tracking-normal text-on-dark/60">h</span>
        </p>
        <div className="mt-4 flex items-center gap-2">
          {current ? <LevelBadge level={current.name} /> : <span className="text-[13px] text-on-dark/60">No level yet</span>}
        </div>
      </div>
      <div className="mt-8">
        <Progress
          dark
          value={pct}
          max={100}
          label={next ? `Next: ${next.name}` : "Highest level reached"}
          valueLabel={next ? `${Math.max(0, Math.ceil(next.minHours - hours))} h to go` : "Platinum"}
        />
        <p className="mt-4 text-[13px] leading-relaxed text-on-dark/55">Hours are credited when an event is completed and you were marked present.</p>
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  const dashboard = useResource(() => api.get("/api/students/dashboard").then((res) => res.data?.dashboard || null), []);
  const profile = useStudentProfile();

  if (dashboard.loading) return <DashboardSkeleton />;
  if (dashboard.status === "error" || !dashboard.data) {
    return <ErrorState title="We couldn't load your dashboard" error={dashboard.error} onRetry={dashboard.reload} />;
  }

  const { student, stats = {}, awards = [], assignedEvents = [] } = dashboard.data;
  const credited = Number(profile.data?.totalVolunteerHours) || 0;
  const upcoming = sortEvents(assignedEvents.filter((e) => e.status === "Upcoming" || e.status === "Ongoing")).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow={student?.institution?.name || "Volunteer"}
        title={
          <>
            {greeting()}
            {student?.name ? (
              <>
                , <Accent>{firstName(student.name)}</Accent>
              </>
            ) : null}
          </>
        }
        description="What you've done, what's next, and how far you've come."
        actions={
          <Button href="/studentlayout/studentevents" icon={CalendarRange}>
            My events
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Journey hours={credited} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-7">
          <StatCard align="bottom" label="Events joined" value={stats.totalEvents || 0} icon={CalendarRange} />
          <StatCard align="bottom" label="Completed" value={stats.completedEvents || 0} icon={Trophy} variant="mint" />
          <StatCard align="bottom" label="Planned hours" value={stats.totalHours || 0} unit="h" icon={Clock3} footnote="Across all your events" />
          <StatCard align="bottom" label="Grace marks" value={stats.graceMarks || 0} icon={Award} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="What's next"
          description="Your upcoming and live events"
          bodyClassName="p-0"
          actions={
            <Link href="/studentlayout/studentevents" className="link-draw text-[13px] font-semibold text-fg-2 hover:text-ink">
              All events
            </Link>
          }
        >
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-center gap-4 px-5 py-4">
                  <DateBlock date={event.date} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14.5px] font-semibold text-fg">{event.title}</p>
                      {event.status === "Ongoing" ? <StatusBadge status="ongoing" label="Live" size="sm" /> : null}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
                      <span className="flex items-center gap-1.5">
                        <MapPin aria-hidden="true" className="size-3.5" /> {event.location || "No location"}
                      </span>
                      <span>{event.hours} h</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={CalendarRange} title="Nothing scheduled" description="When a coordinator adds you to an event, it shows up here." />
          )}
        </Panel>

        <Panel title="Recognition" description="Awards you've earned" bodyClassName="p-0">
          {awards.length ? (
            <ul className="divide-y divide-line">
              {awards.slice(0, 6).map((award, i) => (
                <li key={`${award.title || award.name}-${i}`} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand/25 bg-mint text-brand-700">
                    <Award aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-fg">{award.title || award.name}</span>
                    {award.description ? <span className="block text-[12.5px] text-muted">{award.description}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Trophy} title="No awards yet" description="Awards appear as your hours grow." />
          )}
          <div className="border-t border-line p-3">
            <Button href="/studentlayout/certificates" variant="ghost" size="sm" icon={ScrollText} fullWidth>
              View certificates
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
