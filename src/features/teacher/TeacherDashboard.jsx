"use client";

import Link from "next/link";
import { Award, CalendarCheck, CalendarRange, ClipboardCheck, GraduationCap, MapPin, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, ChartTooltip } from "@/components/charts/chartTheme";
import Button from "@/components/ui/Button";
import DateBlock from "@/components/ui/DateBlock";
import PageHeader, { Accent } from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { firstName, formatDate, formatNumber, greeting } from "@/lib/format";
import { sortEvents } from "./data";

function RecentEvents({ events }) {
  const upcoming = sortEvents(events.filter((e) => e.status !== "Completed" && e.status !== "Cancelled")).slice(0, 5);
  return (
    <Panel
      title="Your events"
      description="Assigned to you, most urgent first"
      actions={
        <Link href="/teacherLayout/myeventsteacher" className="link-draw text-[13px] font-semibold text-fg-2 hover:text-ink">
          All events
        </Link>
      }
      bodyClassName="p-0"
    >
      {upcoming.length ? (
        <ul className="divide-y divide-line">
          {upcoming.map((event) => (
            <li key={event._id} className="flex items-center gap-4 px-5 py-4">
              <DateBlock date={event.date} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-fg">{event.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                  <MapPin aria-hidden="true" className="size-3.5" />
                  {event.location || "No location"}
                </p>
              </div>
              <Button href="/teacherLayout/attendanceByTeacher" size="sm" variant="outline" className="hidden sm:inline-flex">
                Attendance
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState size="sm" icon={CalendarRange} title="No upcoming events" description="Events you're assigned to will appear here." />
      )}
    </Panel>
  );
}

function GraceMarkChart({ stats }) {
  const data = [
    { name: "Approved", value: stats.approved || 0, color: CHART_COLORS.brand },
    { name: "Pending", value: stats.pending || 0, color: CHART_COLORS.warning },
    { name: "Rejected", value: stats.rejected || 0, color: CHART_COLORS.danger },
  ].filter((d) => d.value > 0);

  return (
    <Panel title="Grace marks" description="Recommendations for your students" actions={<Button href="/teacherLayout/approvegracebyteacher" size="sm" variant="outline">Review queue</Button>}>
      {stats.total ? (
        <div className="flex items-center gap-6">
          <div className="relative size-32 shrink-0" role="img" aria-label={`${stats.approved} approved, ${stats.pending} pending, ${stats.rejected} rejected`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius="70%" outerRadius="100%" stroke="none" startAngle={90} endAngle={-270}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="tabular text-2xl font-semibold text-fg">{stats.total}</span>
              <span className="text-[11px] text-muted">total</span>
            </div>
          </div>
          <dl className="flex-1 space-y-2.5">
            {[
              ["Pending review", stats.pending, "text-amber-700"],
              ["Approved", stats.approved, "text-brand-700"],
              ["Rejected", stats.rejected, "text-red-600"],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex items-center justify-between text-[13.5px]">
                <dt className="text-fg-2">{label}</dt>
                <dd className={`tabular font-semibold ${cls}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <EmptyState size="sm" icon={Award} title="No recommendations yet" description="Coordinators recommend grace marks for your review here." />
      )}
    </Panel>
  );
}

export default function TeacherDashboard() {
  const overview = useResource(() => api.get("/api/teacher/overview").then((res) => res.data?.data || null), []);

  if (overview.loading) return <DashboardSkeleton />;
  if (overview.status === "error" || !overview.data) {
    return <ErrorState title="We couldn't load your dashboard" error={overview.error} onRetry={overview.reload} />;
  }

  const d = overview.data;

  return (
    <>
      <PageHeader
        eyebrow={d.institutionName}
        title={
          <>
            {greeting()}
            {d.teacherName ? (
              <>
                , <Accent>{firstName(d.teacherName)}</Accent>
              </>
            ) : null}
          </>
        }
        description="Your assigned events, attendance and grace mark reviews."
        actions={
          <Button href="/teacherLayout/attendanceByTeacher" icon={CalendarCheck}>
            Mark attendance
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard variant="feature" className="col-span-2 lg:col-span-1" label="Your events" value={d.totalEvents} footnote={`${formatNumber(d.completedEvents)} completed · ${formatNumber(d.upcomingEvents)} upcoming`} />
        <StatCard label="Grace marks to review" value={d.graceMarkStats?.pending || 0} icon={ClipboardCheck} align="bottom" />
        <StatCard label="Institution students" value={d.totalStudents} icon={GraduationCap} footnote={`${formatNumber(d.volunteers)} volunteers`} align="bottom" />
        <StatCard label="Institution events" value={d.institutionEvents} icon={Users} align="bottom" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <RecentEvents events={d.recentEvents || []} />
        <GraceMarkChart stats={d.graceMarkStats || {}} />
      </div>

      <p className="mt-6 text-[12.5px] text-subtle">Last loaded {formatDate(new Date(), "time")}.</p>
    </>
  );
}
