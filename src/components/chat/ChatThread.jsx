"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { ChatSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import cx from "@/lib/cx";

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(d);
}

const time = (date) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

const ROLE_LABEL = { coordinator: "Coordinator", teacher: "Teacher", student: "Volunteer", volunteer: "Volunteer", alumni: "Alumni" };

/*
  messages: [{ id, senderId, senderName, senderRole, text, createdAt }]
  Consecutive messages from one sender within five minutes are grouped.
*/
export default function ChatThread({ title, subtitle, meId, messages, loading, error, onRetry, onSend, connected = true, onBack, emptyTitle, emptyDescription, showSenderNames = true }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const submit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await onSend(text);
    if (ok !== false) setDraft("");
    setSending(false);
  };

  return (
    <section aria-label={title} className="flex h-full min-h-0 flex-col bg-paper">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-6">
        {onBack ? <IconButton label="Back to conversations" icon={ArrowLeft} onClick={onBack} className="-ml-2 lg:hidden" /> : null}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
          {subtitle ? <p className="truncate text-[12.5px] text-muted">{subtitle}</p> : null}
        </div>
        <span className={cx("flex items-center gap-1.5 text-[12px] font-medium", connected ? "text-brand-700" : "text-subtle")}>
          <span aria-hidden="true" className={cx("size-1.5 rounded-full", connected ? "bg-brand" : "bg-line-strong")} />
          {connected ? "Live" : "Connecting"}
        </span>
      </header>

      <div ref={scrollRef} data-lenis-prevent className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto bg-canvas px-4 py-6 sm:px-6" aria-live="polite">
        {loading ? (
          <ChatSkeleton />
        ) : error ? (
          <ErrorState size="sm" description="We couldn't load this conversation." onRetry={onRetry} />
        ) : messages.length ? (
          <ol className="space-y-1">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const grouped = !newDay && prev && prev.senderId === m.senderId && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000;
              const mine = meId && String(m.senderId) === String(meId);
              return (
                <li key={m.id}>
                  {newDay ? (
                    <p className="my-5 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-subtle">
                      <span aria-hidden="true" className="h-px flex-1 bg-line" />
                      {dayLabel(m.createdAt)}
                      <span aria-hidden="true" className="h-px flex-1 bg-line" />
                    </p>
                  ) : null}
                  <div className={cx("flex items-end gap-2.5", mine ? "justify-end" : "justify-start", grouped ? "mt-1" : "mt-4")}>
                    {!mine ? <span className="w-8 shrink-0">{grouped ? null : <Avatar name={m.senderName} size="sm" />}</span> : null}
                    <div className={cx("max-w-[78%] sm:max-w-[65%]", mine && "items-end")}>
                      {!mine && !grouped && showSenderNames ? (
                        <p className="mb-1 ml-1 text-[12px] font-semibold text-fg-2">
                          {m.senderName}
                          {ROLE_LABEL[m.senderRole] ? <span className="ml-1.5 font-normal text-subtle">{ROLE_LABEL[m.senderRole]}</span> : null}
                        </p>
                      ) : null}
                      <div
                        className={cx(
                          "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed",
                          mine ? "rounded-br-md bg-ink text-white" : "rounded-bl-md border border-line bg-paper text-fg"
                        )}
                      >
                        {m.text}
                      </div>
                      <p className={cx("mt-1 text-[11px] text-subtle", mine ? "mr-1 text-right" : "ml-1")}>{time(m.createdAt)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState size="sm" title={emptyTitle || "No messages yet"} description={emptyDescription || "Say hello to get the conversation going."} />
        )}
      </div>

      <form onSubmit={submit} className="flex shrink-0 items-end gap-2 border-t border-line bg-paper p-3 sm:p-4">
        <label htmlFor="chat-draft" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-draft"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder="Write a message"
          className="scrollbar-quiet max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-canvas px-4 py-2.5 text-[14.5px] leading-relaxed focus:border-brand-600 focus:bg-paper focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || sending}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-ink transition-colors hover:bg-brand-600 hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          <Send aria-hidden="true" className="size-4" />
        </button>
      </form>
    </section>
  );
}
