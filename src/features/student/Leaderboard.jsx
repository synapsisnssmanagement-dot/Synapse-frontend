"use client";

import { Crown, Medal, Trophy } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { LevelBadge } from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { getUserId } from "@/utils/auth";
import cx from "@/lib/cx";

const RANK_ICON = { 1: Crown, 2: Medal, 3: Medal };
const RANK_TONE = { 1: "text-amber-500", 2: "text-slate-400", 3: "text-orange-700" };

export default function Leaderboard() {
  const board = useResource(
    () => api.get("/api/students/leaderboard").then((res) => res.data?.leaderboard || []),
    []
  );
  const rows = board.data || [];
  const meId = getUserId();

  return (
    <>
      <PageHeader eyebrow="Recognition" title="Leaderboard" description="Top volunteers at your institution, ranked by credited hours." />
      {board.loading ? (
        <TableSkeleton rows={8} columns={3} />
      ) : board.status === "error" ? (
        <ErrorState error={board.error} onRetry={board.reload} />
      ) : rows.length ? (
        <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
          {rows.map((s, i) => {
            const rank = i + 1;
            const RankIcon = RANK_ICON[rank];
            const mine = meId && s._id === meId;
            return (
              <li key={s._id} className={cx("flex items-center gap-4 px-5 py-3.5", mine && "bg-mint")}>
                <span className="flex w-7 shrink-0 items-center justify-center tabular text-[14.5px] font-semibold text-muted">
                  {RankIcon ? <RankIcon aria-hidden="true" className={cx("size-5", RANK_TONE[rank])} /> : rank}
                </span>
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-fg">
                    {s.name}
                    {mine ? <span className="ml-2 text-[12px] font-medium text-brand-700">You</span> : null}
                  </p>
                  <p className="truncate text-[12.5px] text-muted">{s.department}</p>
                </div>
                {s.level ? <LevelBadge level={s.level} size="sm" /> : null}
                <span className="tabular w-20 shrink-0 text-right text-[14.5px] font-semibold text-fg">
                  {s.totalVolunteerHours || 0}
                  <span className="ml-1 text-[11.5px] font-normal text-subtle">hrs</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState icon={Trophy} title="No volunteers yet" description="Once hours are credited, the ranking appears here." />
      )}
    </>
  );
}
