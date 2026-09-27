"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, CalendarPlus, CalendarRange, CheckCircle2, Clock3, Info, MapPin, Presentation, Sparkles, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, ChartLegend, ChartTooltip, axisProps, gridProps } from "@/components/charts/chartTheme";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DateBlock from "@/components/ui/DateBlock";
import PageHeader, { Accent } from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { firstName, formatDate, formatNumber, greeting } from "@/lib/format";
import { attentionItems, deliveredHours, participantCount, presentCount, sortEvents, teacherCount, useCoordinatorProfile, useMyEvents } from "./data";
import useEventLifecycle from "./lifecycle";

const INSIGHT_KEY = "synapsis.coordinator.insight";

function NowAndNext({ events, lifecycle }) {
  const live = events.filter((e) => e.status === "Ongoing");
  const next = sortEvents(events.filter((e) => e.status === "Upcoming")).slice(0, 4);

  return (
    <Panel
      title="Now and next"
      description="Your live and upcoming drives"
      actions={
        <Link href="/coordinatorlayout/myevents" className="link-draw text-[13px] font-semibold text-fg-2 hover:text-ink">
          All events
        </Link>
      }
      bodyClassName="p-0"
    >
      {!live.length && !next.length ? (
        <EmptyState
          size="sm"
          icon={CalendarRange}
          title="Nothing scheduled"
          description="Plan the next drive and it will appear here with its team and status."
          action={
            <Button href="/coordinatorlayout/createevent" size="sm" icon={CalendarPlus}>
              Create event
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {live.map((event) => (
            <li key={event._id} className="flex flex-col gap-4 bg-mint/60 px-5 py-4 sm:flex-row sm:items-center">
              <DateBlock date={event.date} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="ongoing" label="Live now" />
                  <p className="truncate text-[15px] font-semibold text-fg">{event.title}</p>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {presentCount(event)} of {participantCount(event)} volunteers marked present
                </p>
              </div>
              <Button size="sm" variant="dark" onClick={() => lifecycle.complete(event)}>
                Complete event
              </Button>
            </li>
          ))}
          {next.map((event) => (
            <li key={event._id} className="flex items-center gap-4 px-5 py-4">
              <DateBlock date={event.date} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-fg">{event.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                  {event.location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-3.5" />
                      {event.location}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <Users aria-hidden="true" className="size-3.5" />
                    {participantCount(event)} volunteers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Presentation aria-hidden="true" className="size-3.5" />
                    {teacherCount(event)} {teacherCount(event) === 1 ? "teacher" : "teachers"}
                  </span>
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => lifecycle.start(event)} className="hidden sm:inline-flex">
                Start
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const TONE = {
  danger: { icon: AlertTriangle, cls: "border-red-200 bg-red-50 text-red-600" },
  warning: { icon: Clock3, cls: "border-amber-200 bg-amber-50 text-amber-700" },
  info: { icon: Info, cls: "border-blue-200 bg-blue-50 text-blue-600" },
};

function hrefFor(text) {
  if (text.includes("teacher")) return "/coordinatorlayout/manageteacher";
  if (text.includes("volunteers assigned")) return "/coordinatorlayout/managevolunteer";
  return "/coordinatorlayout/myevents";
}

function Attention({ events }) {
  const items = attentionItems(events).slice(0, 5);
  return (
    <Panel title="Needs attention" description="Things that could stop a drive going well" bodyClassName="p-0">
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map(({ event, tone, text }, i) => {
            const { icon: Icon, cls } = TONE[tone];
            return (
              <li key={`${event._id}-${i}`}>
                <Link href={hrefFor(text)} className="group flex gap-3 px-5 py-4 transition-colors hover:bg-canvas">
                  <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-lg border", cls)}>
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-fg">{event.title}</span>
                    <span className="block text-[13px] leading-snug text-muted">{text}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState size="sm" icon={CheckCircle2} title="Everything is on track" description="Every active event has a teacher and volunteers, and nothing is overdue." />
      )}
    </Panel>
  );
}

function MonthlyChart({ events }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(d), completed: 0, planned: 0 };
  });
  events.forEach((event) => {
    const d = event.date ? new Date(event.date) : null;
    if (!d) return;
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) return;
    if (event.status === "Completed") bucket.completed += 1;
    else bucket.planned += 1;
  });
  const any = months.some((m) => m.completed || m.planned);

  return (
    <Panel
      title="Your drives by month"
      description="Last six months"
      actions={
        <ChartLegend
          items={[
            { label: "Completed", color: CHART_COLORS.brand },
            { label: "Planned or live", color: CHART_COLORS.ink },
          ]}
        />
      }
    >
      {any ? (
        <div className="h-56" role="img" aria-label={months.map((m) => `${m.label}: ${m.completed} completed, ${m.planned} planned`).join("; ")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 4, left: -28, bottom: 0 }} barGap={4}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="completed" name="Completed" stackId="a" fill={CHART_COLORS.brand} radius={[0, 0, 0, 0]} maxBarSize={36} />
              <Bar dataKey="planned" name="Planned or live" stackId="a" fill={CHART_COLORS.ink} radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState size="sm" icon={CalendarRange} title="No drives in the last six months" description="Your monthly activity will chart here." />
      )}
    </Panel>
  );
}

function readCachedInsight() {
  try {
    return window.sessionStorage.getItem(INSIGHT_KEY) || "";
  } catch {
    return "";
  }
}

function InsightPanel({ summary }) {
  const [insight, setInsight] = useState(readCachedInsight);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    const prompt = `You are helping an NSS (National Service Scheme) unit coordinator in India.
Unit data:
- Students: ${summary.totalStudents}, of whom volunteers: ${summary.totalVolunteers}
- Teachers: ${summary.totalTeachers}
- Grace mark recommendations made: ${summary.totalGraceRecommendations}
- Institution events: ${summary.allEvents?.totalEvents ?? 0} (${summary.allEvents?.completedEvents ?? 0} completed, ${summary.allEvents?.upcomingEvents ?? 0} upcoming)
- Events this coordinator manages: ${summary.myEvents?.totalEvents ?? 0}
- Volunteer hours delivered in this coordinator's completed events: ${summary.hours}
Write 3 or 4 short, specific observations with one practical suggestion each. Plain sentences, one per line, no headings, no emoji.`;
    try {
      const res = await api.post("/api/ai/generate", { prompt });
      const text = String(res.data?.insight || "").trim();
      setInsight(text);
      try {
        window.sessionStorage.setItem(INSIGHT_KEY, text);
      } catch {
        // Cache is a convenience only.
      }
    } catch (err) {
      setError(errorMessage(err, "The insight service is unavailable right now."));
    } finally {
      setLoading(false);
    }
  };

  const lines = insight
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  return (
    <section aria-labelledby="insight-title" className="flex flex-col rounded-2xl bg-ink p-6 text-on-dark">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="insight-title" className="eyebrow flex items-center gap-2 text-brand">
            <Sparkles aria-hidden="true" className="size-3.5" /> Unit insight
          </p>
          <p className="mt-2 text-[13px] text-on-dark/55">Written by AI from your unit&apos;s numbers.</p>
        </div>
        <Button size="sm" variant={insight ? "outline-dark" : "light"} loading={loading} onClick={generate}>
          {insight ? "Refresh" : "Generate"}
        </Button>
      </div>
      <div aria-live="polite" className="mt-6 flex-1">
        {error ? (
          <p className="text-[14px] text-red-300">{error}</p>
        ) : lines.length ? (
          <ul className="space-y-4">
            {lines.map((line, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-on-dark/85">
                <span aria-hidden="true" className="tabular mt-0.5 text-[12px] font-semibold text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14.5px] leading-relaxed text-on-dark/60">
            Get a short read on participation, momentum and where to focus next. Generated on request so it only runs when you
            need it.
          </p>
        )}
      </div>
    </section>
  );
}

export default function CoordinatorDashboard() {
  const dashboard = useResource(() => api.get("/api/coordinator/coordinatordashboard").then((res) => res.data?.data || {}), []);
  const events = useMyEvents();
  const profile = useCoordinatorProfile();
  const lifecycle = useEventLifecycle((updated) =>
    events.mutate((list) => (list || []).map((e) => (e._id === updated._id ? { ...e, ...updated } : e)))
  );

  if (dashboard.loading || events.loading) return <DashboardSkeleton />;
  if (dashboard.status === "error") {
    return <ErrorState title="We couldn't load your dashboard" error={dashboard.error} onRetry={dashboard.reload} />;
  }

  const d = dashboard.data || {};
  const myEvents = events.data || [];
  const hours = Math.round(myEvents.reduce((sum, e) => sum + deliveredHours(e), 0));
  const completed = myEvents.filter((e) => e.status === "Completed").length;
  const name = profile.data?.name;

  return (
    <>
      <PageHeader
        eyebrow={profile.data?.institutionName || "Coordinator"}
        title={
          <>
            {greeting()}
            {name ? (
              <>
                , <Accent>{firstName(name)}</Accent>
              </>
            ) : null}
          </>
        }
        description="What is happening in your unit, what needs you, and the difference it is making."
        actions={
          <Button href="/coordinatorlayout/createevent" icon={CalendarPlus}>
            Create event
          </Button>
        }
      />

      {events.status === "error" ? (
        <div className="mb-4">
          <ErrorState size="sm" title="We couldn't load your events" error={events.error} onRetry={events.reload} />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <NowAndNext events={myEvents} lifecycle={lifecycle} />
        </div>
        <div className="xl:col-span-5">
          <Attention events={myEvents} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          variant="feature"
          className="col-span-2 lg:col-span-1"
          label="Hours delivered"
          value={hours}
          unit="h"
          footnote={`Across ${completed} completed ${completed === 1 ? "drive" : "drives"}`}
        />
        <StatCard label="Volunteers" value={d.totalVolunteers ?? 0} icon={Users} footnote={`of ${formatNumber(d.totalStudents ?? 0)} students`} align="bottom" />
        <StatCard label="Your events" value={d.myEvents?.totalEvents ?? myEvents.length} icon={CalendarRange} footnote={`${formatNumber(d.myEvents?.upcomingEvents ?? 0)} upcoming`} align="bottom" />
        <StatCard label="Grace marks" value={d.totalGraceRecommendations ?? 0} icon={CheckCircle2} footnote="Recommended so far" align="bottom" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <MonthlyChart events={myEvents} />
        <InsightPanel summary={{ ...d, hours }} />
      </div>

      <p className="mt-6 text-[12.5px] text-subtle">Figures update when events are started, completed and attended. Last loaded {formatDate(new Date(), "time")}.</p>
      {lifecycle.dialog}
    </>
  );
}
