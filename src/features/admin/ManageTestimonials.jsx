"use client";

import { useId, useMemo, useState } from "react";
import { Check, EyeOff, Lock, Quote } from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Identity from "@/components/ui/Identity";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import useResource from "@/hooks/useResource";
import api, { errorMessage, getList } from "@/lib/api";
import { timeAgo } from "@/lib/format";

const FILTERS = [
  { id: "pending", label: "Awaiting review" },
  { id: "approved", label: "On the website" },
  { id: "rejected", label: "Hidden" },
  { id: "all", label: "All" },
];

export default function ManageTestimonials() {
  const tabsId = useId();
  const list = useResource(() => getList("/api/alumni/testimonials", "testimonials"), []);
  const [filter, setFilter] = useState("pending");
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => list.data || [], [list.data]);
  const counts = useMemo(() => {
    const out = { pending: 0, approved: 0, rejected: 0, all: rows.length };
    rows.forEach((t) => {
      const v = t.visibility || "pending";
      if (out[v] != null) out[v] += 1;
    });
    return out;
  }, [rows]);
  const visible = filter === "all" ? rows : rows.filter((t) => (t.visibility || "pending") === filter);

  const setVisibility = async (item, visibility) => {
    setBusy(`${item.testimonialId}:${visibility}`);
    try {
      await api.put(`/api/alumni/${item.alumniId}/testimonial/${item.testimonialId}/visibility`, { visibility });
      list.mutate((current) => (current || []).map((t) => (t.testimonialId === item.testimonialId ? { ...t, visibility } : t)));
      toast.success(visibility === "approved" ? "Published on the website." : "Hidden from the website.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't update that testimonial."));
    } finally {
      setBusy(null);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Community"
      title="Testimonials"
      description="Alumni reflections, reviewed before they appear in the Voices section of the public website."
    />
  );

  if (list.loading) {
    return (
      <>
        {header}
        <CardGridSkeleton count={4} className="xl:grid-cols-2" />
      </>
    );
  }

  if (list.status === "error") {
    const forbidden = list.error?.response?.status === 403;
    return (
      <>
        {header}
        {forbidden ? (
          <EmptyState
            icon={Lock}
            title="Only the super admin can moderate testimonials"
            description="Ask your super admin to review alumni testimonials, or sign in with that account."
          />
        ) : (
          <ErrorState title="We couldn't load testimonials" error={list.error} onRetry={list.reload} />
        )}
      </>
    );
  }

  return (
    <>
      {header}
      <Tabs
        id={tabsId}
        label="Filter testimonials"
        className="mb-6"
        value={filter}
        onChange={setFilter}
        tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))}
      />
      <div {...tabPanelProps(tabsId, filter)}>
        {visible.length ? (
          <ul className="grid gap-4 xl:grid-cols-2">
            {visible.map((item) => {
              const visibility = item.visibility || "pending";
              return (
                <li key={item.testimonialId} className="flex flex-col rounded-xl border border-line bg-paper">
                  <figure className="flex flex-1 flex-col p-6">
                    <Quote aria-hidden="true" className="size-5 text-brand-700" />
                    <blockquote className="mt-4 flex-1 font-display text-[1.35rem] leading-snug tracking-[-0.01em] text-ink">{item.message}</blockquote>
                    <figcaption className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <Identity
                        name={item.name}
                        src={item.profileImage}
                        meta={[item.department, item.graduationYear && `Class of ${item.graduationYear}`].filter(Boolean).join(" · ") || "Alumni"}
                      />
                      <span className="text-[12.5px] text-subtle">{timeAgo(item.createdAt)}</span>
                    </figcaption>
                  </figure>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-3">
                    <StatusBadge status={visibility} label={visibility === "approved" ? "Published" : visibility === "rejected" ? "Hidden" : "Awaiting review"} />
                    <div className="flex gap-2">
                      {visibility !== "rejected" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={EyeOff}
                          loading={busy === `${item.testimonialId}:rejected`}
                          onClick={() => setVisibility(item, "rejected")}
                        >
                          Hide
                        </Button>
                      ) : null}
                      {visibility !== "approved" ? (
                        <Button size="sm" icon={Check} loading={busy === `${item.testimonialId}:approved`} onClick={() => setVisibility(item, "approved")}>
                          Publish
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Quote}
            title={filter === "pending" ? "Nothing to review" : filter === "approved" ? "No published testimonials" : filter === "rejected" ? "Nothing hidden" : "No testimonials yet"}
            description={
              filter === "pending"
                ? "When alumni share a reflection, it waits here until you publish or hide it."
                : "Testimonials move here when you change their visibility."
            }
          />
        )}
      </div>
    </>
  );
}
