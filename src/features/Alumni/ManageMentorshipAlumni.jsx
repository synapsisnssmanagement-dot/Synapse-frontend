"use client";

import { useId, useState } from "react";
import { Check, Link2, MessageCircle, Play, Square, Users, X } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import api, { errorMessage } from "@/lib/api";
import { formatDate, photoOf } from "@/lib/format";
import { useMentees } from "./data";

const FILTERS = [
  { id: "pending", label: "Requests" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

export default function ManageMentorshipAlumni() {
  const tabsId = useId();
  const requests = useMentees();
  const [filter, setFilter] = useState("pending");
  const [busy, setBusy] = useState(null);
  const [ending, setEnding] = useState(null);
  const [linkFor, setLinkFor] = useState(null);
  const [link, setLink] = useState("");

  const all = requests.data || [];
  const counts = { all: all.length };
  all.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  const patch = (id, changes) => requests.mutate((list) => (list || []).map((r) => (r._id === id ? { ...r, ...changes } : r)));

  const act = async (r, action, body, changes, success, key = action) => {
    setBusy(`${r._id}:${key}`);
    try {
      await api.put(`/api/mentorship/${r._id}/${action}`, body);
      patch(r._id, changes);
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, "That didn't work. Please try again."));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveLink = async (e) => {
    e.preventDefault();
    const value = link.trim();
    if (!/^https?:\/\//i.test(value)) {
      toast.error("Enter a full link starting with https://");
      return;
    }
    if (await act(linkFor, "meeting-link", { link: value }, { meetingLink: value }, "Meeting link shared.")) setLinkFor(null);
  };

  return (
    <>
      <PageHeader eyebrow="Mentorship" title="Mentees" description="Accept requests, run sessions, and share a meeting link when you're ready to talk." />
      <Tabs id={tabsId} label="Filter mentorships" className="mb-5" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] || 0 }))} />

      <div {...tabPanelProps(tabsId, filter)}>
        {requests.loading ? (
          <CardGridSkeleton count={4} className="xl:grid-cols-2" />
        ) : requests.status === "error" ? (
          <ErrorState error={requests.error} onRetry={requests.reload} />
        ) : rows.length ? (
          <ul className="grid gap-4 xl:grid-cols-2">
            {rows.map((r) => (
              <li key={r._id} className="flex flex-col rounded-xl border border-line bg-paper p-5">
                <div className="flex items-start gap-3">
                  <Avatar src={photoOf(r.mentee)} name={r.mentee?.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-fg">{r.mentee?.name || "Student"}</p>
                    <p className="truncate text-[13px] text-muted">{r.mentee?.department || r.mentee?.email}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-fg">{r.topic}</p>
                {r.description ? <p className="mt-1 text-[14px] leading-relaxed text-fg-2">{r.description}</p> : null}
                <p className="mt-3 text-[12.5px] text-subtle">Requested {formatDate(r.requestDate || r.createdAt)}</p>
                {r.meetingLink ? (
                  <a href={r.meetingLink} target="_blank" rel="noopener noreferrer" className="link-draw mt-2 truncate text-[13px] font-semibold text-brand-700">
                    {r.meetingLink}
                  </a>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {r.status === "pending" ? (
                    <>
                      <Button size="sm" variant="danger-soft" icon={X} loading={busy === `${r._id}:respond-no`} onClick={() => act(r, "respond", { status: "rejected" }, { status: "rejected" }, "Request declined.", "respond-no")}>
                        Decline
                      </Button>
                      <Button size="sm" icon={Check} loading={busy === `${r._id}:respond`} onClick={() => act(r, "respond", { status: "active" }, { status: "active" }, `You're now mentoring ${r.mentee?.name || "this student"}.`)}>
                        Accept
                      </Button>
                    </>
                  ) : null}
                  {r.status === "active" ? (
                    <>
                      <Button href={`/alumnilayout/mentorshipchatlayout/mentorshipchat/${r._id}`} size="sm" icon={MessageCircle}>
                        Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Link2}
                        onClick={() => {
                          setLinkFor(r);
                          setLink(r.meetingLink || "");
                        }}
                      >
                        {r.meetingLink ? "Change link" : "Share link"}
                      </Button>
                      {!r.startDate ? (
                        <Button size="sm" variant="ghost" icon={Play} loading={busy === `${r._id}:start`} onClick={() => act(r, "start", {}, { startDate: new Date().toISOString() }, "Session started.")}>
                          Start
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" icon={Square} onClick={() => setEnding(r)}>
                        End mentorship
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Users} title={filter === "pending" ? "No new requests" : `No ${filter === "all" ? "" : filter} mentorships`} description="Students request mentors from their dashboard. New requests appear here." />
        )}
      </div>

      <Modal
        open={Boolean(linkFor)}
        onClose={() => setLinkFor(null)}
        title="Share a meeting link"
        description={linkFor ? `${linkFor.mentee?.name || "Your mentee"} will see it on their mentorship page.` : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setLinkFor(null)}>
              Cancel
            </Button>
            <Button type="submit" form="meeting-link" loading={busy === `${linkFor?._id}:meeting-link`}>
              Save link
            </Button>
          </>
        }
      >
        <form id="meeting-link" onSubmit={saveLink}>
          <Input label="Meeting link" type="url" leading={Link2} placeholder="https://meet.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} data-autofocus />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(ending)}
        onClose={() => setEnding(null)}
        onConfirm={async () => {
          if (await act(ending, "end", {}, { status: "completed", endDate: new Date().toISOString() }, "Mentorship completed.")) setEnding(null);
        }}
        loading={busy === `${ending?._id}:end`}
        tone="info"
        title="End this mentorship?"
        confirmLabel="End mentorship"
        description={`It moves to completed and ${ending?.mentee?.name || "your mentee"} can leave feedback.`}
      />
    </>
  );
}
