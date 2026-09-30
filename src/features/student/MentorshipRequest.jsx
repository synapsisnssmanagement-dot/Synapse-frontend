"use client";

import { useState } from "react";
import { Send, UserRoundSearch } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import { photoOf } from "@/lib/format";

function availabilityLabel(value) {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? "Available" : "Unavailable";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "isAvailable" in value) return value.isAvailable ? "Available" : "Unavailable";
  return null;
}

export default function MentorshipRequest() {
  const mentors = useResource(() => api.get("/api/mentorship/mentors").then((res) => res.data?.mentors || []), []);
  const [query, setQuery] = useState("");
  const [mentor, setMentor] = useState(null);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = (mentors.data || []).filter((m) => !q || `${m.name} ${m.department}`.toLowerCase().includes(q));

  const close = () => {
    setMentor(null);
    setTopic("");
    setDescription("");
  };

  const send = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Add a topic so your mentor knows what to expect.");
      return;
    }
    setSending(true);
    try {
      await api.post("/api/mentorship/request", { mentorId: mentor._id, topic: topic.trim(), description: description.trim() });
      toast.success(`Request sent to ${mentor.name}.`);
      close();
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't send that request."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mentorship"
        title="Find a mentor"
        description="Alumni who served in NSS before you, ready to share what they've learned."
        actions={<SearchInput value={query} onChange={setQuery} placeholder="Search by name or department" className="w-72" />}
      />

      {mentors.loading ? (
        <CardGridSkeleton count={6} />
      ) : mentors.status === "error" ? (
        <ErrorState error={mentors.error} onRetry={mentors.reload} />
      ) : rows.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((m) => {
            const availability = availabilityLabel(m.mentorshipAvailability);
            return (
              <li key={m._id} className="flex flex-col rounded-xl border border-line bg-paper p-5">
                <div className="flex items-center gap-4">
                  <Avatar src={photoOf(m)} name={m.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-fg">{m.name}</p>
                    <p className="truncate text-[13px] text-muted">{m.department || "Alumni"}</p>
                  </div>
                </div>
                {availability ? (
                  <Badge tone={availability === "Unavailable" ? "neutral" : "success"} className="mt-4 self-start">
                    {availability}
                  </Badge>
                ) : null}
                <Button variant="dark" size="sm" icon={Send} className="mt-5" onClick={() => setMentor(m)} disabled={availability === "Unavailable"}>
                  Request mentorship
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={UserRoundSearch} title={q ? "No mentors match" : "No mentors yet"} description={q ? "Try a different name or department." : "Alumni mentors from your institution will appear here."} />
      )}

      <Modal
        open={Boolean(mentor)}
        onClose={close}
        eyebrow="Mentorship request"
        title={mentor ? `Ask ${mentor.name}` : ""}
        description="Tell them what you'd like help with. They'll accept or decline from their dashboard."
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" form="mentorship-request" icon={Send} loading={sending}>
              Send request
            </Button>
          </>
        }
      >
        <form id="mentorship-request" onSubmit={send} className="space-y-5" noValidate>
          <Input label="Topic" placeholder="e.g. Preparing for campus placements" value={topic} onChange={(e) => setTopic(e.target.value)} required data-autofocus />
          <Textarea label="Details" rows={4} placeholder="Anything that would help them prepare." value={description} onChange={(e) => setDescription(e.target.value)} />
        </form>
      </Modal>
    </>
  );
}
