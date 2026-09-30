"use client";

import { MessageSquareQuote, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { averageRating, useMenteeFeedback } from "./data";

function Stars({ value }) {
  return (
    <span role="img" aria-label={`${value} out of 5`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={cx("size-4", n <= value ? "fill-warning text-warning" : "text-line-strong")} />
      ))}
    </span>
  );
}

export default function AlumniFeedback() {
  const feedback = useMenteeFeedback();
  const rows = feedback.data || [];
  const avg = averageRating(rows);

  return (
    <>
      <PageHeader eyebrow="Mentorship" title="Feedback" description="What your mentees said after your sessions ended." />
      {feedback.loading ? (
        <CardGridSkeleton count={4} className="xl:grid-cols-2" />
      ) : feedback.status === "error" ? (
        <ErrorState error={feedback.error} onRetry={feedback.reload} />
      ) : rows.length ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <StatCard label="Average rating" value={avg ? avg.toFixed(1) : "—"} unit="/ 5" variant="mint" />
            <StatCard label="Reviews" value={rows.length} />
          </div>
          <ul className="grid gap-4 xl:grid-cols-2">
            {rows.map((f) => (
              <li key={f.mentorshipId} className="rounded-xl border border-line bg-paper p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={f.mentee?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-fg">{f.mentee?.name || "Mentee"}</p>
                    <p className="truncate text-[12.5px] text-muted">{f.topic}</p>
                  </div>
                  <Stars value={f.feedback?.rating || 0} />
                </div>
                {f.feedback?.comment ? <p className="mt-4 font-display text-[1.15rem] leading-snug text-ink">&ldquo;{f.feedback.comment}&rdquo;</p> : null}
                {f.completedAt ? <p className="mt-3 text-[12.5px] text-subtle">Completed {formatDate(f.completedAt)}</p> : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState icon={MessageSquareQuote} title="No feedback yet" description="When a mentorship ends, your mentee can rate it. Their feedback appears here." />
      )}
    </>
  );
}
