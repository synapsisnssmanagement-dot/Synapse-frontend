"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import ChatThread from "@/components/chat/ChatThread";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useSocket } from "@/context/SocketContext";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { getUserId } from "@/utils/auth";

const ROLES = {
  coordinator: {
    events: () => getList("/api/coordinator/my-events", "events"),
    institution: () => api.get("/api/coordinator/profile").then((res) => res.data?.data?.institution),
    sendPath: "/api/chat/coordinator/send",
  },
  teacher: {
    events: () => api.get("/api/teacher/teachermyevents").then((res) => res.data?.data || []),
    institution: () => api.get("/api/teacher/profile").then((res) => res.data?.teacher?.institution),
    sendPath: "/api/chat/teacher/send",
  },
  student: {
    events: () => getList("/api/students/my-events", "events"),
    institution: () => api.get("/api/students/profile").then((res) => res.data?.student?.institution),
    sendPath: "/api/chat/student/send",
  },
};

const idOf = (value) => (value && typeof value === "object" ? String(value._id || "") : value ? String(value) : "");

function normalize(m) {
  return {
    id: String(m._id || `${m.createdAt}-${m.content}`),
    senderId: m.sender?.id ? String(m.sender.id) : "",
    senderName: m.sender?.name || "Unknown",
    senderRole: m.sender?.role,
    text: m.content,
    createdAt: m.createdAt || new Date().toISOString(),
  };
}

function useConnected(socket) {
  return useSyncExternalStore(
    (notify) => {
      if (!socket) return () => {};
      socket.on("connect", notify);
      socket.on("disconnect", notify);
      return () => {
        socket.off("connect", notify);
        socket.off("disconnect", notify);
      };
    },
    () => Boolean(socket?.connected),
    () => false
  );
}

const STATUS_RANK = { Ongoing: 0, Upcoming: 1, Completed: 2, Cancelled: 3 };

export default function EventChat({ role }) {
  const config = ROLES[role];
  const socket = useSocket();
  const connected = useConnected(socket);
  const [meId] = useState(getUserId);
  const events = useResource(config.events, [role]);
  const institution = useResource(config.institution, [role]);
  const [eventId, setEventId] = useState(null);

  const institutionId = idOf(institution.data);
  const list = useMemo(
    () =>
      [...(events.data || [])].sort(
        (a, b) => (STATUS_RANK[a.status] ?? 4) - (STATUS_RANK[b.status] ?? 4) || new Date(b.date || 0) - new Date(a.date || 0)
      ),
    [events.data]
  );
  const selected = list.find((e) => String(e._id) === eventId) || null;

  const messages = useResource(
    () => api.get(`/api/chat/events/${eventId}/messages`).then((res) => (res.data?.messages || []).map(normalize)),
    [eventId],
    { enabled: Boolean(eventId) }
  );
  const { mutate } = messages;

  useEffect(() => {
    if (!socket || !eventId || !institutionId) return undefined;
    const room = { eventId, institutionId };
    const join = () => socket.emit("join_room", room);
    const onMessage = (raw) => {
      if (String(raw.eventId) !== eventId) return;
      const msg = normalize(raw);
      mutate((current) => (current?.some((m) => m.id === msg.id) ? current : [...(current || []), msg]));
    };
    const onError = (text) => toast.error(typeof text === "string" ? text : "Chat error");
    join();
    socket.on("connect", join);
    socket.on("new_message", onMessage);
    socket.on("error_message", onError);
    return () => {
      socket.emit("leave_room", room);
      socket.off("connect", join);
      socket.off("new_message", onMessage);
      socket.off("error_message", onError);
    };
  }, [socket, eventId, institutionId, mutate]);

  const send = async (text) => {
    if (socket?.connected && institutionId) {
      socket.emit("send_message", { eventId, institutionId, content: text });
      return true;
    }
    try {
      const res = await api.post(config.sendPath, { eventId, content: text });
      const msg = normalize(res.data?.message || {});
      mutate((current) => [...(current || []), msg]);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, "Your message wasn't sent."));
      return false;
    }
  };

  return (
    <div className="flex h-full min-h-[480px]">
      <aside className={cx("w-full shrink-0 flex-col border-r border-line bg-paper lg:flex lg:w-80", selected ? "hidden" : "flex")}>
        <div className="border-b border-line px-5 py-4">
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-fg">Event chat</h1>
          <p className="text-[13px] text-muted">One room per event, shared by its whole team.</p>
        </div>
        <div data-lenis-prevent className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto">
          {events.loading ? (
            <div className="space-y-4 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.status === "error" ? (
            <ErrorState size="sm" error={events.error} onRetry={events.reload} />
          ) : list.length ? (
            <ul className="p-2">
              {list.map((event) => {
                const active = String(event._id) === eventId;
                return (
                  <li key={event._id}>
                    <button
                      type="button"
                      onClick={() => setEventId(String(event._id))}
                      aria-current={active ? "true" : undefined}
                      className={cx("flex w-full flex-col gap-1 rounded-lg px-3 py-3 text-left transition-colors", active ? "bg-ink text-white" : "hover:bg-canvas")}
                    >
                      <span className={cx("truncate text-[14px] font-semibold", active ? "text-white" : "text-fg")}>{event.title}</span>
                      <span className="flex items-center gap-2">
                        <span className={cx("text-[12px]", active ? "text-on-dark/60" : "text-muted")}>{formatDate(event.date)}</span>
                        {event.status === "Ongoing" ? <StatusBadge status="ongoing" label="Live" size="sm" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState size="sm" icon={MessagesSquare} title="No event rooms yet" description="A room opens for every event you're part of." />
          )}
        </div>
      </aside>

      <div className={cx("min-w-0 flex-1", selected ? "block" : "hidden lg:block")}>
        {selected ? (
          <ChatThread
            key={eventId}
            title={selected.title}
            subtitle={`${formatDate(selected.date)} · ${selected.location || "Event room"}`}
            meId={meId}
            messages={messages.data || []}
            loading={messages.loading}
            error={messages.status === "error"}
            onRetry={messages.reload}
            onSend={send}
            connected={connected}
            onBack={() => setEventId(null)}
            emptyDescription="Coordinate with the team here — everyone assigned to this event can read it."
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-canvas">
            <EmptyState icon={MessagesSquare} title="Pick an event" description="Choose an event on the left to open its room." />
          </div>
        )}
      </div>
    </div>
  );
}
