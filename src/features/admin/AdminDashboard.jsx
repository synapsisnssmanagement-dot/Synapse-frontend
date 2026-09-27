"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, CalendarRange, CheckCircle2, Quote, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, ChartLegend, ChartTooltip, axisProps, gridProps } from "@/components/charts/chartTheme";
import Button from "@/components/ui/Button";
import PageHeader, { Accent } from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import cx from "@/lib/cx";
import { firstName, formatDate, formatNumber, greeting } from "@/lib/format";
import { PEOPLE, PEOPLE_ORDER, useDashboardStats } from "./people";

function ReviewPanel({ stats }) {
  const total = PEOPLE_ORDER.reduce((sum, key) => sum + (stats[key]?.pending || 0), 0);
  return (
    <section aria-labelledby="review-title" className="flex flex-col justify-between rounded-2xl bg-ink p-6 text-on-dark sm:p-7">
      <div>
        <p id="review-title" className="eyebrow flex items-center gap-2 text-on-dark/55">
          <span aria-hidden="true" className={cx("size-1.5 rounded-full", total ? "animate-pulse-dot bg-brand" : "bg-on-dark/30")} />
          Needs your review
        </p>
        <p className="tabular mt-5 text-[clamp(3.25rem,6vw,4.75rem)] font-semibold leading-none tracking-[-0.05em] text-brand">
          {formatNumber(total)}
        </p>
        <p className="mt-3 max-w-xs text-[14.5px] leading-relaxed text-on-dark/65">
          {total ? `${total === 1 ? "account is" : "accounts are"} waiting for approval before they can sign in.` : "Everyone who signed up has been reviewed."}
        </p>
      </div>
      <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
        {PEOPLE_ORDER.map((key) => {
          const item = PEOPLE[key];
          const count = stats[key]?.pending || 0;
          return (
            <li key={key}>
              <Link href={item.pendingHref} className="group flex items-center justify-between gap-4 py-3 text-[14px]">
                <span className="text-on-dark/75 transition-colors group-hover:text-white">{item.title}</span>
                <span className="flex items-center gap-3">
                  <span className={cx("tabular font-semibold", count ? "text-white" : "text-on-dark/35")}>{count}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-on-dark/35 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GrowthChart({ stats }) {
  const series = [
    { key: "student", label: "Students", color: CHART_COLORS.brand },
    { key: "teacher", label: "Teachers", color: CHART_COLORS.ink },
    { key: "coordinator", label: "Coordinators", color: CHART_COLORS.slate },
  ];
  const days = stats.student?.growth || [];
  const data = days.map((day, i) => ({
    date: day.date,
    student: day.count,
    teacher: stats.teacher?.growth?.[i]?.count || 0,
    coordinator: stats.coordinator?.growth?.[i]?.count || 0,
  }));
  const totals = series.map((s) => ({ ...s, value: data.reduce((sum, d) => sum + d[s.key], 0) }));
  const any = totals.some((t) => t.value > 0);

  return (
    <Panel title="New sign-ups" description="Last 7 days, by account type" actions={<ChartLegend items={totals.map((t) => ({ label: t.label, color: t.color, value: t.value }))} />}>
      {any ? (
        <div className="h-64" role="img" aria-label={totals.map((t) => `${t.value} ${t.label.toLowerCase()}`).join(", ") + " signed up in the last 7 days"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="fill-student" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={(v) => formatDate(v, "short")} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip content={<ChartTooltip labelFormatter={(v) => formatDate(v, "long")} />} cursor={{ stroke: CHART_COLORS.mist }} />
              <Area type="monotone" dataKey="student" name="Students" stroke={CHART_COLORS.brand} strokeWidth={2.5} fill="url(#fill-student)" />
              <Area type="monotone" dataKey="teacher" name="Teachers" stroke={CHART_COLORS.ink} strokeWidth={1.75} fill="transparent" />
              <Area type="monotone" dataKey="coordinator" name="Coordinators" stroke={CHART_COLORS.slate} strokeWidth={1.75} strokeDasharray="4 4" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState size="sm" icon={Users} title="A quiet week" description="No new accounts in the last 7 days. Sign-ups will chart here as they arrive." />
      )}
    </Panel>
  );
}

function EventsPanel({ event = {} }) {
  const completed = event.completed || 0;
  const upcoming = event.upcoming || 0;
  const other = Math.max(0, (event.total || 0) - completed - upcoming);
  const data = [
    { name: "Completed", value: completed, color: CHART_COLORS.brand },
    { name: "Upcoming", value: upcoming, color: CHART_COLORS.ink },
    { name: "Ongoing", value: other, color: CHART_COLORS.slate },
  ].filter((d) => d.value > 0);

  return (
    <Panel title="Events" description="Across every institution">
      {event.total ? (
        <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
          <div className="relative size-44 shrink-0" role="img" aria-label={`${completed} completed, ${upcoming} upcoming, ${other} ongoing events`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius="72%" outerRadius="100%" paddingAngle={data.length > 1 ? 3 : 0} stroke="none" startAngle={90} endAngle={-270}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="tabular text-3xl font-semibold tracking-[-0.04em] text-fg">{formatNumber(event.total)}</span>
              <span className="text-[12px] text-muted">events</span>
            </div>
          </div>
          <dl className="w-full space-y-3">
            {[
              ["Completed", completed, CHART_COLORS.brand],
              ["Upcoming", upcoming, CHART_COLORS.ink],
              ["Ongoing", other, CHART_COLORS.slate],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-line pb-3 text-[14px] last:border-0">
                <dt className="flex items-center gap-2.5 text-fg-2">
                  <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: color }} />
                  {label}
                </dt>
                <dd className="tabular font-semibold text-fg">{formatNumber(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <EmptyState size="sm" icon={CalendarRange} title="No events yet" description="Events appear here once coordinators start planning drives." />
      )}
    </Panel>
  );
}

function DepartmentPanel({ departments = [] }) {
  const top = departments.filter((d) => d._id).slice(0, 8);
  const max = Math.max(1, ...top.map((d) => d.count));
  return (
    <Panel title="Students by department" description="Largest departments first">
      {top.length ? (
        <ul className="space-y-3.5">
          {top.map((d, i) => (
            <li key={d._id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[13.5px]">
                <span className="truncate font-medium text-fg">{d._id}</span>
                <span className="tabular font-semibold text-fg-2">{formatNumber(d.count)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-mist">
                <div className={cx("h-full rounded-full", i === 0 ? "bg-brand" : "bg-ink/70")} style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState size="sm" icon={Users} title="No students yet" description="Department breakdowns appear once students join." />
      )}
    </Panel>
  );
}

const SHORTCUTS = [
  { label: "Add an institution", text: "Register a new college so its people can sign up.", href: "/adminpanel/createinstitution", icon: Building2 },
  { label: "Moderate testimonials", text: "Choose which alumni stories appear on the public site.", href: "/adminpanel/testimonials", icon: Quote },
  { label: "Browse the student directory", text: "Search every student and volunteer account.", href: "/adminpanel/allstudent", icon: Users },
];

export default function AdminDashboard() {
  const stats = useDashboardStats();
  const profile = useResource(() => api.get("/api/admin/profile").then((res) => res.data?.admin || null), []);
  const name = profile.data?.name || (typeof window !== "undefined" ? localStorage.getItem("name") : "");

  if (stats.loading) return <DashboardSkeleton />;
  if (stats.status === "error") {
    return <ErrorState title="We couldn't load the dashboard" error={stats.error} onRetry={stats.reload} />;
  }
  const s = stats.data || {};

  return (
    <>
      <PageHeader
        eyebrow="Overview"
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
        description="Everything happening across Synapsis — who is waiting, who joined, and how the units are doing."
        actions={
          <Button href="/adminpanel/createinstitution" variant="outline" size="sm" icon={Building2}>
            Add institution
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ReviewPanel stats={s} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
          <StatCard
            align="bottom"
            label="Students"
            value={(s.student?.total || 0) + (s.student?.volunteer || 0)}
            icon={PEOPLE.student.icon}
            footnote={`${formatNumber(s.student?.volunteer || 0)} volunteers · ${formatNumber(s.student?.active || 0)} active`}
          />
          <StatCard align="bottom" label="Teachers" value={s.teacher?.total || 0} icon={PEOPLE.teacher.icon} footnote={`${formatNumber(s.teacher?.active || 0)} active`} />
          <StatCard
            align="bottom"
            label="Coordinators"
            value={s.coordinator?.total || 0}
            icon={PEOPLE.coordinator.icon}
            footnote={`${formatNumber(s.coordinator?.active || 0)} active`}
          />
          <StatCard align="bottom" label="Alumni" value={s.alumni?.total || 0} icon={PEOPLE.alumni.icon} footnote={`${formatNumber(s.alumni?.active || 0)} active`} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <GrowthChart stats={s} />
        <EventsPanel event={s.event} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DepartmentPanel departments={s.student?.bydepartment} />
        <Panel title="Shortcuts" bodyClassName="p-2">
          <ul>
            {SHORTCUTS.map(({ label, text, href, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-canvas">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-fg-2 group-hover:border-brand/30 group-hover:text-brand-700">
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-fg">{label}</span>
                    <span className="block text-[13px] text-muted">{text}</span>
                  </span>
                  <ArrowUpRight aria-hidden="true" className="size-4 text-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                </Link>
              </li>
            ))}
          </ul>
          {!PEOPLE_ORDER.some((key) => s[key]?.pending) ? (
            <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-[13px] text-brand-700">
              <CheckCircle2 aria-hidden="true" className="size-4" /> No approvals are waiting.
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
