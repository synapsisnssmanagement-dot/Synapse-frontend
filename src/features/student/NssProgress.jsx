"use client";

import { AlertTriangle, CheckCircle2, Circle, GraduationCap, Tent } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";

const round = (n) => Math.round((Number(n) || 0) * 10) / 10;

function statusLine(e, target) {
  if (e.eligible) return { tone: "success", text: "Eligible for the NSS certificate" };
  const remaining = round(e.remainingHours ?? Math.max(0, target - (e.total || 0)));
  const parts = [];
  if (remaining > 0) parts.push(`${formatNumber(remaining)} hours`);
  if (!e.campDone) parts.push("a special camp");
  return { tone: "neutral", text: parts.length ? `${parts.join(" and ")} to go` : "Almost there" };
}

export default function NssProgress() {
  const res = useResource(() => api.get("/api/nss/me/eligibility").then((r) => r.data), []);

  if (res.loading) {
    return (
      <div role="status" aria-busy="true" className="rounded-2xl border border-line bg-paper p-6">
        <span className="sr-only">Loading NSS progress</span>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-6 w-64 max-w-full" />
        <Skeleton className="mt-6 h-2 w-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (res.status === "error") {
    if (res.error?.response?.status === 403) {
      return <p className="rounded-xl border border-line bg-paper px-5 py-4 text-[13.5px] text-muted">Only enrolled NSS volunteers earn hours toward the NSS certificate.</p>;
    }
    return (
      <div className="rounded-2xl border border-line bg-paper">
        <ErrorState size="sm" title="We couldn't load your NSS progress" error={res.error} onRetry={res.reload} />
      </div>
    );
  }

  const data = res.data || {};
  const e = data.eligibility || {};
  const target = data.rules?.targetHours || 240;
  const yearly = data.rules?.yearlyHours || 120;
  const total = round(e.total);
  const thisYear = round(e.currentYear);
  const status = statusLine(e, target);
  const camp = (e.camps || [])[0];
  const years = e.years || [];

  return (
    <section aria-labelledby="nss-progress-title" className="rounded-2xl border border-line bg-paper p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p id="nss-progress-title" className="eyebrow text-muted">
            NSS certificate
          </p>
          <p className="mt-2 flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] text-fg">
            {e.eligible ? <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-brand-700" /> : <GraduationCap aria-hidden="true" className="size-5 shrink-0 text-subtle" />}
            {status.text}
          </p>
        </div>
        {e.eligible ? (
          <Badge tone="success" icon={CheckCircle2}>
            Eligible
          </Badge>
        ) : null}
      </div>

      <Progress className="mt-6" size="lg" value={total} max={target} label="Total service hours" valueLabel={`${formatNumber(total)} / ${target} h`} />

      {e.behindPace && !e.eligible ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            You&apos;re behind this year&apos;s pace — about {formatNumber(Math.round(e.expectedThisYear || 0))} hours expected by now.
          </span>
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Progress
            size="sm"
            tone={e.behindPace ? "warning" : "brand"}
            value={thisYear}
            max={yearly}
            label={`This academic year${data.currentYear ? ` (${data.currentYear})` : ""}`}
            valueLabel={`${formatNumber(thisYear)} / ${yearly} h`}
          />
          {years.length ? (
            <ul className="divide-y divide-line rounded-lg border border-line text-[13.5px]">
              {years.map((y) => (
                <li key={y.label || y.year} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-fg-2">{y.label || y.year}</span>
                  <span className="tabular font-semibold text-fg">{formatNumber(round(y.hours))} h</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <ul aria-label="Requirements" className="space-y-2 text-[13.5px]">
          <li className="flex items-start gap-3 rounded-lg border border-line p-3">
            {total >= target ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" /> : <Circle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-subtle" />}
            <span>
              <span className="block font-semibold text-fg">{target} service hours</span>
              <span className="block text-muted">{total >= target ? "Done" : `Not yet — ${formatNumber(round(target - total))} h left`}</span>
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-line p-3">
            {e.campDone ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" /> : <Tent aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-subtle" />}
            <span>
              <span className="block font-semibold text-fg">One special camp</span>
              <span className="block text-muted">
                {e.campDone && camp ? `Done — ${camp.title}${camp.date ? `, ${formatDate(camp.date)}` : ""}` : e.campDone ? "Done" : "Not yet attended"}
              </span>
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
