"use client";

import Link from "next/link";
import { HandCoins, MessageCircle, Quote, Star, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader, { Accent } from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { firstName, greeting, photoOf, timeAgo } from "@/lib/format";
import { averageRating, useAlumniDashboard, useMenteeFeedback, useMentees } from "./data";

export default function AlumniDashboard() {
  const dashboard = useAlumniDashboard();
  const mentees = useMentees();
  const feedback = useMenteeFeedback();

  if (dashboard.loading) return <DashboardSkeleton />;
  if (dashboard.status === "error" || !dashboard.data) {
    return <ErrorState title="We couldn't load your dashboard" error={dashboard.error} onRetry={dashboard.reload} />;
  }

  const a = dashboard.data;
  const requests = mentees.data || [];
  const pending = requests.filter((r) => r.status === "pending");
  const active = requests.filter((r) => r.status === "active");
  const completed = requests.filter((r) => r.status === "completed");
  const rating = averageRating(feedback.data || []);
  const testimonials = a.testimonials || [];

  return (
    <>
      <PageHeader
        eyebrow={a.institution?.name || "Alumni"}
        title={
          <>
            {greeting()}, <Accent>{firstName(a.name)}</Accent>
          </>
        }
        description={`${a.department || "Alumni"}${a.graduationYear ? ` · Class of ${a.graduationYear}` : ""}. Thank you for staying close to the unit.`}
        actions={
          <Button href="/alumnilayout/donations" icon={HandCoins}>
            Support a drive
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <section aria-labelledby="requests-title" className="flex flex-col rounded-2xl bg-ink p-6 text-on-dark lg:col-span-5">
          <p id="requests-title" className="eyebrow text-on-dark/55">
            Waiting on you
          </p>
          <p className="tabular mt-5 text-[clamp(3.25rem,6vw,4.75rem)] font-semibold leading-none tracking-[-0.05em] text-brand">{pending.length}</p>
          <p className="mt-3 text-[14.5px] text-on-dark/65">{pending.length === 1 ? "student has" : "students have"} asked you to mentor them.</p>
          <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
            {pending.slice(0, 3).map((r) => (
              <li key={r._id} className="flex items-center gap-3 py-3">
                <Avatar src={photoOf(r.mentee)} name={r.mentee?.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-white">{r.mentee?.name}</span>
                  <span className="block truncate text-[12.5px] text-on-dark/55">{r.topic}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button href="/alumnilayout/managementorship" variant="light" size="sm" className="mt-auto self-start">
            {pending.length ? "Review requests" : "Manage mentees"}
          </Button>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:col-span-7">
          <StatCard align="bottom" label="Active mentees" value={active.length} icon={Users} variant="mint" />
          <StatCard align="bottom" label="Completed" value={completed.length} icon={MessageCircle} />
          <StatCard align="bottom" label="Mentee rating" value={rating ? rating.toFixed(1) : "—"} unit={rating ? "/ 5" : undefined} icon={Star} footnote={`${(feedback.data || []).length} ${(feedback.data || []).length === 1 ? "review" : "reviews"}`} />
          <StatCard align="bottom" label="Testimonials" value={testimonials.length} icon={Quote} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Your mentees"
          bodyClassName="p-0"
          actions={
            <Link href="/alumnilayout/mentorshipchatlayout" className="link-draw text-[13px] font-semibold text-fg-2 hover:text-ink">
              Open chat
            </Link>
          }
        >
          {active.length || completed.length ? (
            <ul className="divide-y divide-line">
              {[...active, ...completed].slice(0, 5).map((r) => (
                <li key={r._id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar src={photoOf(r.mentee)} name={r.mentee?.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-fg">{r.mentee?.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">{r.topic}</span>
                  </span>
                  <StatusBadge status={r.status} size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Users} title="No mentees yet" description="Accepted requests will appear here." />
          )}
        </Panel>

        <Panel
          title="Your testimonials"
          bodyClassName="p-0"
          actions={
            <Link href="/alumnilayout/testimonials" className="link-draw text-[13px] font-semibold text-fg-2 hover:text-ink">
              Write one
            </Link>
          }
        >
          {testimonials.length ? (
            <ul className="divide-y divide-line">
              {testimonials.slice(0, 4).map((t) => (
                <li key={t._id} className="px-5 py-4">
                  <p className="line-clamp-2 font-display text-[1.1rem] leading-snug text-ink">&ldquo;{t.message}&rdquo;</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={t.visibility || "pending"} label={t.visibility === "approved" ? "Published" : t.visibility === "rejected" ? "Not published" : "In review"} size="sm" />
                    {t.createdAt ? <span className="text-[12px] text-subtle">{timeAgo(t.createdAt)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Quote} title="No testimonials yet" description="Share what NSS meant to you — it may appear on the public site." />
          )}
        </Panel>
      </div>
    </>
  );
}
