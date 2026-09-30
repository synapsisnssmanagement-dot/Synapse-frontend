"use client";

import { useState } from "react";
import { Quote, Send } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useAlumniDashboard } from "./data";

const MIN = 20;
const MAX = 600;

export default function AlumniTestimonials() {
  const dashboard = useAlumniDashboard();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const mine = [...(dashboard.data?.testimonials || [])].reverse();
  const length = message.trim().length;

  const submit = async (e) => {
    e.preventDefault();
    if (length < MIN) {
      toast.error(`Write at least ${MIN} characters.`);
      return;
    }
    setSending(true);
    try {
      await api.post("/api/alumni/testimonial", { message: message.trim() });
      toast.success("Submitted. An administrator reviews it before it's published.");
      setMessage("");
      dashboard.reload();
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't submit your testimonial."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Community" title="Testimonials" description="What did NSS mean to you? Approved reflections appear in the Voices section of the public site." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel title="Write a testimonial">
          <form onSubmit={submit} className="space-y-4">
            <Textarea
              label="Your reflection"
              rows={7}
              maxLength={MAX}
              placeholder="A moment, a lesson, a person — whatever stayed with you."
              hint={`${length} / ${MAX} characters`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="submit" icon={Send} loading={sending} disabled={length < MIN}>
              Submit for review
            </Button>
          </form>
        </Panel>
        <Panel title="Your submissions" bodyClassName="p-0">
          {dashboard.loading ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : dashboard.status === "error" ? (
            <ErrorState size="sm" error={dashboard.error} onRetry={dashboard.reload} />
          ) : mine.length ? (
            <ul className="divide-y divide-line">
              {mine.map((t) => (
                <li key={t._id} className="px-5 py-4">
                  <p className="font-display text-[1.15rem] leading-snug text-ink">&ldquo;{t.message}&rdquo;</p>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge status={t.visibility || "pending"} label={t.visibility === "approved" ? "Published" : t.visibility === "rejected" ? "Not published" : "In review"} size="sm" />
                    {t.createdAt ? <span className="text-[12px] text-subtle">{timeAgo(t.createdAt)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" icon={Quote} title="Nothing submitted yet" description="Your testimonials and their review status will appear here." />
          )}
        </Panel>
      </div>
    </>
  );
}
