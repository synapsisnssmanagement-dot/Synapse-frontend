"use client";

import { useState } from "react";
import { Award, Check, X } from "lucide-react";
import { toast } from "react-toastify";
import Avatar from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/format";

export default function ApproveGraceMark() {
  const list = useResource(() => api.get("/api/teacher/pending-recommendations").then((res) => res.data?.data || []), []);
  const [busy, setBusy] = useState(null);

  const decide = async (item, approve) => {
    setBusy(`${item.id}:${approve}`);
    try {
      await api.put("/api/teacher/approverecommendedgracemark", { studentId: item.id, approve });
      list.mutate((current) => (current || []).filter((r) => r.id !== item.id));
      toast.success(approve ? `Approved ${item.marks} marks for ${item.name}.` : `Rejected the recommendation for ${item.name}.`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't record that decision."));
    } finally {
      setBusy(null);
    }
  };

  const rows = list.data || [];

  return (
    <>
      <PageHeader eyebrow="Recognition" title="Review grace marks" description="Recommendations coordinators have made for your students, waiting on your decision." />

      {list.loading ? (
        <CardGridSkeleton count={4} className="xl:grid-cols-2" />
      ) : list.status === "error" ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : rows.length ? (
        <ul className="grid gap-4 xl:grid-cols-2">
          {rows.map((item) => (
            <li key={item.id} className="flex flex-col rounded-xl border border-line bg-paper p-5">
              <div className="flex items-start gap-3">
                <Avatar name={item.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-fg">{item.name}</p>
                  <p className="truncate text-[13px] text-muted">{item.department || item.email}</p>
                </div>
                <Badge tone="warning" icon={Award}>
                  {item.marks} marks
                </Badge>
              </div>
              <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-fg-2">&ldquo;{item.reason}&rdquo;</p>
              <p className="mt-4 text-[12.5px] text-subtle">
                Recommended by {item.recommendedBy}
                {item.date ? ` · ${timeAgo(item.date)}` : ""}
              </p>
              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <Button size="sm" variant="danger-soft" icon={X} loading={busy === `${item.id}:false`} onClick={() => decide(item, false)} className="flex-1">
                  Reject
                </Button>
                <Button size="sm" icon={Check} loading={busy === `${item.id}:true`} onClick={() => decide(item, true)} className="flex-1">
                  Approve
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Award} title="Nothing to review" description="When a coordinator recommends a grace mark for one of your students, it will appear here." />
      )}
    </>
  );
}
