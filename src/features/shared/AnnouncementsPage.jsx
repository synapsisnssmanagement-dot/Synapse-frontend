"use client";

import { useId, useMemo, useState } from "react";
import { CheckCheck, Megaphone, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import PageHeader from "@/components/ui/PageHeader";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { timeAgo } from "@/lib/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

export default function AnnouncementsPage() {
  const tabsId = useId();
  const list = useResource(() => api.get("/api/notification").then((res) => res.data?.notifications || []), []);
  const [filter, setFilter] = useState("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const rows = list.data || [];
  const unread = rows.filter((n) => !n.read).length;
  const visible = filter === "unread" ? rows.filter((n) => !n.read) : rows;

  const markRead = async (notification) => {
    if (notification.read) return;
    list.mutate((current) => current.map((n) => (n._id === notification._id ? { ...n, read: true } : n)));
    try {
      await api.put(`/api/notification/read/${notification._id}`);
    } catch (error) {
      list.mutate((current) => current.map((n) => (n._id === notification._id ? { ...n, read: false } : n)));
      toast.error(errorMessage(error, "Couldn't update that notification."));
    }
  };

  const markAll = async () => {
    const previous = rows;
    list.mutate((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await api.put("/api/notification/read-all");
      toast.success("All caught up.");
    } catch (error) {
      list.mutate(previous);
      toast.error(errorMessage(error, "Couldn't mark everything as read."));
    }
  };

  const remove = async (notification) => {
    const previous = rows;
    list.mutate((current) => current.filter((n) => n._id !== notification._id));
    try {
      await api.delete(`/api/notification/${notification._id}`);
    } catch (error) {
      list.mutate(previous);
      toast.error(errorMessage(error, "Couldn't delete that notification."));
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await api.delete("/api/notification");
      list.mutate([]);
      toast.success("Notifications cleared.");
      setConfirmClear(false);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't clear notifications."));
    } finally {
      setClearing(false);
    }
  };

  const counts = useMemo(() => ({ all: rows.length, unread }), [rows.length, unread]);

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Announcements"
        description="Updates about your events, grace marks and assignments."
        actions={
          rows.length ? (
            <>
              {unread ? (
                <IconButton label="Mark all as read" icon={CheckCheck} onClick={markAll} variant="outline" />
              ) : null}
              <IconButton label="Clear all notifications" icon={Trash2} onClick={() => setConfirmClear(true)} variant="outline" className="hover:border-red-200 hover:text-red-600" />
            </>
          ) : null
        }
      />

      {list.loading ? (
        <PageSkeleton />
      ) : list.status === "error" ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : rows.length ? (
        <>
          <Tabs id={tabsId} label="Filter announcements" className="mb-5" value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} />
          <div {...tabPanelProps(tabsId, filter)}>
            {visible.length ? (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                {visible.map((notification) => (
                  <li key={notification._id} className={cx("flex gap-3 p-4 transition-colors", !notification.read && "bg-mint/50")}>
                    <button type="button" onClick={() => markRead(notification)} className="flex min-w-0 flex-1 gap-3 text-left">
                      <span aria-hidden="true" className={cx("mt-1.5 size-2 shrink-0 rounded-full", notification.read ? "bg-transparent" : "bg-brand")} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-semibold text-fg">
                          {notification.title}
                          {!notification.read ? <span className="sr-only"> (unread)</span> : null}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] leading-relaxed text-fg-2">{notification.message}</span>
                        <span className="mt-1.5 block text-[12px] text-subtle">{timeAgo(notification.createdAt)}</span>
                      </span>
                    </button>
                    <IconButton label={`Delete: ${notification.title}`} icon={Trash2} size="sm" onClick={() => remove(notification)} className="shrink-0 hover:bg-red-50 hover:text-red-600" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState size="sm" icon={CheckCheck} title="Nothing unread" description="You're caught up on every announcement." />
            )}
          </div>
        </>
      ) : (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Updates about events, assignments and grace marks will appear here." />
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        loading={clearing}
        title="Clear all notifications?"
        confirmLabel="Clear all"
        description="This removes every notification from your list. This can't be undone."
      />
    </>
  );
}
