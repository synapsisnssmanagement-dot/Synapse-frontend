"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import ChatThread from "@/components/chat/ChatThread";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import cx from "@/lib/cx";
import { photoOf } from "@/lib/format";
import { getToken, getUserId } from "@/utils/auth";
import { SOCKET_URL } from "@/utils/config";

const ROLES = {
  student: {
    sessions: () => api.get("/api/mentorship/student").then((res) => res.data?.sessions || []),
    other: (s) => s.mentor,
    otherLabel: "Mentor",
    messagesPath: (id) => `/api/mentorshipmessage/studentchat/${id}`,
    base: "/studentlayout/mentorshipchatlayout",
    href: (id) => `/studentlayout/mentorshipchatlayout/chat/${id}`,
    findHref: "/studentlayout/mentorshiprequestbyvolunteer",
  },
  alumni: {
    sessions: () => api.get("/api/mentorship/mentor").then((res) => res.data?.requests || []),
    other: (s) => s.mentee,
    otherLabel: "Mentee",
    messagesPath: (id) => `/api/mentorshipmessage/alumnichat/${id}`,
    base: "/alumnilayout/mentorshipchatlayout",
    href: (id) => `/alumnilayout/mentorshipchatlayout/mentorshipchat/${id}`,
    findHref: "/alumnilayout/managementorship",
  },
};

function normalize(m) {
  return {
    id: String(m._id || `${m.createdAt}-${m.message}`),
    senderId: m.senderId ? String(m.senderId) : "",
    senderRole: m.senderRole,
    text: m.message,
    createdAt: m.createdAt || new Date().toISOString(),
  };
}

function Thread({ config, session, meId, onBack }) {
  const other = config.other(session);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const messages = useResource(() => api.get(config.messagesPath(session._id)).then((res) => (res.data?.messages || []).map(normalize)), [session._id]);
  const { mutate } = messages;

  useEffect(() => {
    const s = io(`${SOCKET_URL}/mentorship-chat`, { transports: ["websocket"], auth: { token: getToken() } });
    const join = () => {
      setConnected(true);
      s.emit("joinMentorship", { mentorshipId: session._id });
    };
    s.on("connect", join);
    s.on("disconnect", () => setConnected(false));
    s.on("newMentorMessage", (raw) => {
      if (String(raw.mentorship) !== String(session._id)) return;
      const msg = normalize(raw);
      mutate((current) => (current?.some((m) => m.id === msg.id) ? current : [...(current || []), msg]));
    });
    s.on("error_message", (text) => toast.error(typeof text === "string" ? text : "Chat error"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the socket is an external system created per conversation
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [session._id, mutate]);

  const send = async (text) => {
    if (!socket?.connected) {
      toast.error("Still connecting — try again in a moment.");
      return false;
    }
    socket.emit("sendMentorMessage", { mentorshipId: session._id, message: text });
    return true;
  };

  const withNames = (messages.data || []).map((m) => ({ ...m, senderName: m.senderId === meId ? "You" : other?.name || config.otherLabel }));

  return (
    <ChatThread
      title={other?.name || config.otherLabel}
      subtitle={`${config.otherLabel} · ${session.topic}`}
      meId={meId}
      messages={withNames}
      loading={messages.loading}
      error={messages.status === "error"}
      onRetry={messages.reload}
      onSend={send}
      connected={connected}
      onBack={onBack}
      showSenderNames={false}
      emptyDescription="This conversation is private to the two of you."
    />
  );
}

export default function MentorshipChat({ role }) {
  const config = ROLES[role];
  const router = useRouter();
  const params = useParams();
  const selectedId = params?.mentorshipId ? String(params.mentorshipId) : null;
  const [meId] = useState(getUserId);
  const sessions = useResource(config.sessions, [role]);

  const list = (sessions.data || []).filter((s) => s.status !== "pending" && s.status !== "cancelled");
  const selected = list.find((s) => String(s._id) === selectedId) || null;

  return (
    <div className="flex h-full min-h-[480px]">
      <aside className={cx("w-full shrink-0 flex-col border-r border-line bg-paper lg:flex lg:w-80", selectedId ? "hidden" : "flex")}>
        <div className="border-b border-line px-5 py-4">
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-fg">Mentorship chat</h1>
          <p className="text-[13px] text-muted">Private conversations with your {role === "student" ? "mentors" : "mentees"}.</p>
        </div>
        <div data-lenis-prevent className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto">
          {sessions.loading ? (
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sessions.status === "error" ? (
            <ErrorState size="sm" error={sessions.error} onRetry={sessions.reload} />
          ) : list.length ? (
            <ul className="p-2">
              {list.map((s) => {
                const other = config.other(s);
                const active = String(s._id) === selectedId;
                return (
                  <li key={s._id}>
                    <button
                      type="button"
                      onClick={() => router.push(config.href(s._id))}
                      aria-current={active ? "true" : undefined}
                      className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors", active ? "bg-ink" : "hover:bg-canvas")}
                    >
                      <Avatar src={photoOf(other)} name={other?.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className={cx("block truncate text-[14px] font-semibold", active ? "text-white" : "text-fg")}>{other?.name || config.otherLabel}</span>
                        <span className={cx("block truncate text-[12px]", active ? "text-on-dark/60" : "text-muted")}>{s.topic}</span>
                      </span>
                      {s.status === "completed" ? <StatusBadge status="completed" size="sm" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              size="sm"
              icon={MessageCircle}
              title="No conversations yet"
              description={role === "student" ? "Chats open once a mentor accepts your request." : "Chats open once you accept a mentee's request."}
            />
          )}
        </div>
      </aside>

      <div className={cx("min-w-0 flex-1", selectedId ? "block" : "hidden lg:block")}>
        {selected ? (
          <Thread key={selected._id} config={config} session={selected} meId={meId} onBack={() => router.push(config.base)} />
        ) : selectedId && sessions.loading ? (
          <div className="h-full bg-canvas" />
        ) : (
          <div className="flex h-full items-center justify-center bg-canvas">
            <EmptyState
              icon={MessageCircle}
              title={selectedId ? "Conversation not found" : "Pick a conversation"}
              description={selectedId ? "It may still be pending, or it isn't one of yours." : "Choose someone on the left to continue talking."}
            />
          </div>
        )}
      </div>
    </div>
  );
}
