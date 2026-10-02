"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, CheckCircle2, NotebookPen, Tent, Users } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api, { errorMessage } from "@/lib/api";
import cx from "@/lib/cx";
import { formatDate, photoOf } from "@/lib/format";

const dayKey = (d) => new Date(d).toDateString();

function RollCall({ camp, day, onSaved }) {
  const [picked, setPicked] = useState(() => new Set(day.recorded ? day.present : camp.participants.map((p) => String(p._id))));
  const [saving, setSaving] = useState(false);
  const future = new Date(day.date) > new Date();

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/api/nss/events/${camp._id}/camp-day`, { date: day.date, present: [...picked] });
      onSaved(day.date, res.data?.present || [...picked]);
      toast.success(`Roll call saved for ${formatDate(day.date)}.`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save the roll call."));
    } finally {
      setSaving(false);
    }
  };

  if (!camp.participants.length) {
    return <EmptyState size="sm" icon={Users} title="No campers yet" description="Assign volunteers to this camp from Volunteers first." />;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span>
          {day.recorded ? "Saved" : "Not recorded yet"} · <span className="tabular font-semibold text-fg">{picked.size}</span> of {camp.participants.length} present
        </span>
        <span className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(camp.participants.map((p) => String(p._id))))}>
            All present
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>
            Clear
          </Button>
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {camp.participants.map((p) => {
          const id = String(p._id);
          const on = picked.has(id);
          return (
            <li key={id}>
              <label className={cx("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors", on ? "border-brand/30 bg-mint" : "border-line hover:border-line-strong")}>
                <input type="checkbox" checked={on} onChange={() => toggle(id)} className="size-4 accent-brand-700" />
                <Avatar src={photoOf(p)} name={p.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-fg">{p.name}</span>
                  <span className="block truncate text-[12px] text-muted">{p.department}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">{future ? "This day hasn't happened yet, but you can record it in advance." : "Hours are credited per day present when the camp is completed."}</p>
        <Button icon={Check} loading={saving} onClick={save}>
          Save roll call
        </Button>
      </div>
    </div>
  );
}

function Diary({ camp, onAdded }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const entries = [...(camp.diary || [])].reverse();

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || body.trim().length < 10) {
      toast.error("Add a title and at least a sentence.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(`/api/nss/events/${camp._id}/diary`, { title: title.trim(), body: body.trim() });
      onAdded(res.data.entry);
      setTitle("");
      setBody("");
      toast.success("Diary entry added. Campers can read it.");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't add that entry."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="space-y-3">
        <Input label="Entry title" placeholder="e.g. Day 3: Well-cleaning at Kuzhivila" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="What happened today" rows={4} placeholder="Work done, who led it, what the village said, what's planned tomorrow." value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" icon={NotebookPen} loading={saving}>
          Add to diary
        </Button>
      </form>
      {entries.length ? (
        <ol className="space-y-4 border-l border-line pl-5">
          {entries.map((d) => (
            <li key={d._id} className="relative">
              <span aria-hidden="true" className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-brand" />
              <p className="text-[12px] text-subtle">
                {formatDate(d.date, "long")}
                {d.authorName ? ` · ${d.authorName}` : ""}
              </p>
              <p className="mt-0.5 text-[15px] font-semibold text-fg">{d.title}</p>
              <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-fg-2">{d.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState size="sm" icon={BookOpen} title="The diary is empty" description="A few lines each evening become the camp's record, and its report later." />
      )}
    </div>
  );
}

export default function CampManager({ role }) {
  const { eventId } = useParams();
  const resource = useResource(() => api.get(`/api/nss/events/${eventId}/camp`).then((res) => res.data?.camp), [eventId]);
  const camp = resource.data;
  const [selected, setSelected] = useState(null);
  const back = role === "teacher" ? "/teacherLayout/myeventsteacher" : "/coordinatorlayout/myevents";

  const days = useMemo(() => camp?.days || [], [camp]);
  const todayKey = dayKey(new Date());
  const activeKey = selected || (days.find((d) => dayKey(d.date) === todayKey) ? todayKey : days[0] && dayKey(days[0].date));
  const activeDay = days.find((d) => dayKey(d.date) === activeKey);

  if (resource.loading) return <Skeleton className="h-96 w-full" />;
  if (resource.status === "error" || !camp) return <ErrorState title="We couldn't open this camp" error={resource.error} onRetry={resource.reload} />;

  const recordedDays = days.filter((d) => d.recorded).length;

  return (
    <>
      <Button href={back} variant="ghost" size="sm" icon={ArrowLeft} className="-ml-2 mb-3 text-muted">
        Back
      </Button>
      <PageHeader
        eyebrow="Special camp"
        title={camp.title}
        description={`${camp.location} · ${days.length} days · roll call taken on ${recordedDays} of ${days.length}`}
        actions={camp.status ? <StatusBadge status={camp.status} label={camp.status === "Ongoing" ? "Live" : undefined} /> : null}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Daily roll call" description="Campers earn the planned hours for every day they're present.">
          <div className="scrollbar-quiet -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Camp days">
            {days.map((d, i) => {
              const key = dayKey(d.date);
              const active = key === activeKey;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(key)}
                  className={cx(
                    "flex min-w-20 shrink-0 flex-col items-center rounded-lg border px-3 py-2 transition-colors",
                    active ? "border-ink bg-ink text-white" : "border-line bg-paper text-fg-2 hover:border-line-strong"
                  )}
                >
                  <span className={cx("text-[11px] font-semibold uppercase tracking-wide", active ? "text-on-dark/60" : "text-subtle")}>Day {i + 1}</span>
                  <span className="tabular text-[14px] font-semibold">{formatDate(d.date, "short")}</span>
                  <span className={cx("mt-1 flex items-center gap-1 text-[11px]", active ? "text-brand" : d.recorded ? "text-brand-700" : "text-subtle")}>
                    {d.recorded ? <CheckCircle2 aria-hidden="true" className="size-3" /> : null}
                    {d.recorded ? `${d.present.length} here` : "Open"}
                  </span>
                </button>
              );
            })}
          </div>
          {activeDay ? (
            <RollCall
              key={activeKey + (activeDay.recorded ? "r" : "n")}
              camp={camp}
              day={activeDay}
              onSaved={(date, present) =>
                resource.mutate((c) => ({ ...c, days: c.days.map((d) => (dayKey(d.date) === dayKey(date) ? { ...d, recorded: true, present } : d)) }))
              }
            />
          ) : (
            <EmptyState size="sm" icon={Tent} title="No camp days" description="Set the camp's start and end dates first." />
          )}
        </Panel>

        <Panel title="Camp diary" description="Shared with every camper.">
          <Diary camp={camp} onAdded={(entry) => resource.mutate((c) => ({ ...c, diary: [...(c.diary || []), entry] }))} />
        </Panel>
      </div>
    </>
  );
}
