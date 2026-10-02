"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { IconButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useSocket } from "@/context/SocketContext";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";

function timeAgo(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export default function NotificationsMenu({ viewAllHref }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const resource = useResource(() => api.get("/api/notification").then((res) => res.data?.notifications || []), []);
  const notifications = resource.data || [];
  const unread = notifications.filter((n) => !n.read).length;
  const socket = useSocket();
  const { mutate } = resource;

  // New notifications arrive over the socket the moment they're created.
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (notification) => {
      mutate((list) => (list || []).some((n) => n._id === notification._id) ? list : [notification, ...(list || [])]);
      toast(notification.title, { description: notification.message });
    };
    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, [socket, mutate]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = async (notification) => {
    if (notification.read) return;
    resource.mutate((list) => list.map((n) => (n._id === notification._id ? { ...n, read: true } : n)));
    try {
      await api.put(`/api/notification/read/${notification._id}`);
    } catch (error) {
      resource.mutate((list) => list.map((n) => (n._id === notification._id ? { ...n, read: false } : n)));
      toast.error(errorMessage(error, "Couldn't update that notification."));
    }
  };

  const markAll = async () => {
    const previous = notifications;
    resource.mutate((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/notification/read-all");
    } catch (error) {
      resource.mutate(previous);
      toast.error(errorMessage(error, "Couldn't mark notifications as read."));
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <IconButton
        label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        icon={Bell}
        badge={unread}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      />
      <AnimatePresence>
        {open ? (
          <motion.div
            role="region"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-(--z-overlay) w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-paper shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-fg">
                Notifications
                {unread ? <span className="tabular ml-2 rounded-sm bg-ink px-1.5 py-0.5 text-[11px] font-bold text-white">{unread}</span> : null}
              </p>
              {unread ? (
                <button type="button" onClick={markAll} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700 hover:text-ink">
                  <CheckCheck aria-hidden="true" className="size-3.5" /> Mark all read
                </button>
              ) : null}
            </div>
            <div data-lenis-prevent className="scrollbar-quiet max-h-[420px] overflow-y-auto">
              {resource.loading ? (
                <div className="space-y-4 p-4" role="status" aria-label="Loading notifications">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : resource.status === "error" ? (
                <ErrorState size="sm" description="We couldn't load your notifications." onRetry={resource.reload} />
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-lg border border-line bg-canvas text-muted">
                    <BellOff aria-hidden="true" className="size-4" />
                  </span>
                  <p className="text-sm font-semibold text-fg">You&apos;re all caught up</p>
                  <p className="mt-1 text-[13px] text-muted">New events, assignments and approvals will show up here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {notifications.slice(0, 20).map((notification) => (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() => markRead(notification)}
                        className={cx("flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-canvas", !notification.read && "bg-mint/50")}
                      >
                        <span
                          aria-hidden="true"
                          className={cx("mt-1.5 size-2 shrink-0 rounded-full", notification.read ? "bg-transparent" : "bg-brand")}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold text-fg">
                            {notification.title}
                            {!notification.read ? <span className="sr-only"> (unread)</span> : null}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{notification.message}</span>
                          <span className="mt-1.5 block text-[11.5px] text-subtle">{timeAgo(notification.createdAt)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {viewAllHref ? (
              <Link
                href={viewAllHref}
                onClick={() => setOpen(false)}
                className="block border-t border-line bg-canvas px-4 py-3 text-center text-[13px] font-semibold text-fg hover:text-brand-700"
              >
                View all announcements
              </Link>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
