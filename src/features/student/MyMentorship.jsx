"use client";

import { useId, useState } from "react";
import { ExternalLink, MessageCircle, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate, photoOf } from "@/lib/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
];

function Stars({ value, onChange, size = "md" }) {
  return (
    <div role={onChange ? "radiogroup" : "img"} aria-label={onChange ? "Rating" : `${value} out of 5`} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onClick={() => onChange(n)}
            className="rounded p-0.5"
          >
            <Star aria-hidden="true" className={cx(size === "lg" ? "size-7" : "size-4", n <= value ? "fill-warning text-warning" : "text-line-strong")} />
          </button>
        ) : (
          <Star key={n} aria-hidden="true" className={cx("size-4", n <= value ? "fill-warning text-warning" : "text-line-strong")} />
        )
      )}
    </div>
  );
}

export default function MyMentorship() {
  const tabsId = useId();
  const sessions = useResource(() => api.get("/api/mentorship/student").then((res) => res.data?.sessions || []), []);
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const all = sessions.data || [];
  const counts = { all: all.length };
  all.forEach((s) => {
    counts[s.status] = (counts[s.status] || 0) + 1;
  });
  const rows = filter === "all" ? all : all.filter((s) => s.status === filter);

  const closeReview = () => {
    setReviewing(null);
    setRating(0);
    setComment("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Choose a rating first.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/mentorship/${reviewing._id}/feedback`, { rating, comment: comment.trim() });
      sessions.mutate((list) => (list || []).map((s) => (s._id === reviewing._id ? { ...s, menteeFeedback: { rating, comment: comment.trim() } } : s)));
      toast.success("Thanks for the feedback.");
      closeReview();
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save your feedback."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="My mentors"
        description="Your mentorship requests and sessions."
        actions={
          <Button href="/studentlayout/mentorshiprequestbyvolunteer" variant="outline" icon={Sparkles}>
            Find a mentor
          </Button>
        }
      />

      <Tabs id={tabsId} label="Filter mentorships" className="mb-5" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] || 0 }))} />

      <div {...tabPanelProps(tabsId, filter)}>
        {sessions.loading ? (
          <CardGridSkeleton count={4} className="xl:grid-cols-2" />
        ) : sessions.status === "error" ? (
          <ErrorState error={sessions.error} onRetry={sessions.reload} />
        ) : rows.length ? (
          <ul className="grid gap-4 xl:grid-cols-2">
            {rows.map((s) => {
              const feedback = s.menteeFeedback;
              return (
                <li key={s._id} className="flex flex-col rounded-xl border border-line bg-paper p-5">
                  <div className="flex items-start gap-3">
                    <Avatar src={photoOf(s.mentor)} name={s.mentor?.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-fg">{s.mentor?.name || "Mentor"}</p>
                      <p className="truncate text-[13px] text-muted">{s.mentor?.department || "Alumni"}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-4 text-[15px] font-semibold text-fg">{s.topic}</p>
                  {s.description ? <p className="mt-1 line-clamp-3 text-[14px] leading-relaxed text-fg-2">{s.description}</p> : null}
                  <p className="mt-3 text-[12.5px] text-subtle">Requested {formatDate(s.requestDate || s.createdAt)}</p>
                  {feedback?.rating ? (
                    <div className="mt-4 rounded-lg border border-line bg-canvas p-3">
                      <Stars value={feedback.rating} />
                      {feedback.comment ? <p className="mt-2 text-[13px] text-fg-2">{feedback.comment}</p> : null}
                    </div>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {s.status === "active" ? (
                      <Button href={`/studentlayout/mentorshipchatlayout/chat/${s._id}`} size="sm" icon={MessageCircle}>
                        Open chat
                      </Button>
                    ) : null}
                    {s.meetingLink && s.status !== "pending" ? (
                      <Button href={s.meetingLink} target="_blank" rel="noopener noreferrer" size="sm" variant="outline" icon={ExternalLink}>
                        Meeting link
                      </Button>
                    ) : null}
                    {s.status === "completed" && !feedback?.rating ? (
                      <Button size="sm" variant="dark" icon={Star} onClick={() => setReviewing(s)}>
                        Leave feedback
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title={filter === "all" ? "No mentorships yet" : `No ${filter} mentorships`}
            description="Request a mentor to get started."
            action={
              <Button href="/studentlayout/mentorshiprequestbyvolunteer" size="sm">
                Find a mentor
              </Button>
            }
          />
        )}
      </div>

      <Modal
        open={Boolean(reviewing)}
        onClose={closeReview}
        title={reviewing ? `How was your time with ${reviewing.mentor?.name || "your mentor"}?` : ""}
        footer={
          <>
            <Button variant="outline" onClick={closeReview} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="mentor-feedback" loading={saving}>
              Submit feedback
            </Button>
          </>
        }
      >
        <form id="mentor-feedback" onSubmit={submit} className="space-y-5">
          <Stars value={rating} onChange={setRating} size="lg" />
          <Textarea label="Comment" rows={4} placeholder="What helped most?" value={comment} onChange={(e) => setComment(e.target.value)} />
        </form>
      </Modal>
    </>
  );
}
