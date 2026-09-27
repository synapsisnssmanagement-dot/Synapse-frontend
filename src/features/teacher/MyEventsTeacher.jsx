"use client";

import { useId, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, ImagePlus, MapPin, Pencil, Users } from "lucide-react";
import { toast } from "react-toastify";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/DataTable";
import DateBlock from "@/components/ui/DateBlock";
import { Drawer } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import Tabs, { tabPanelProps } from "@/components/ui/Tabs";
import UploadZone from "@/components/ui/UploadZone";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { sortEvents, useMyEvents } from "./data";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "Ongoing", label: "Live" },
  { id: "Completed", label: "Completed" },
];

function EditDrawer({ event, open, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    title: event?.title || "",
    description: event?.description || "",
    location: event?.location || "",
    date: event?.date ? String(event.date).slice(0, 10) : "",
    hours: event?.hours ?? "",
    status: event?.status || "Upcoming",
  }));
  const [saving, setSaving] = useState(false);
  const update = (e) => setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/teacher/${event._id}/edit`, values);
      toast.success("Event updated.");
      onSaved({ ...event, ...values, hours: Number(values.hours) || event.hours });
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save the event."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Edit event"
      title={event?.title || ""}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="teacher-edit-event" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="teacher-edit-event" onSubmit={save} className="space-y-5" noValidate>
        <Input label="Event name" name="title" value={values.title} onChange={update} required />
        <Textarea label="Description" name="description" rows={4} value={values.description} onChange={update} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Date" name="date" type="date" leading={CalendarDays} value={values.date} onChange={update} />
          <Input label="Hours" name="hours" type="number" min={1} max={24} step="0.5" value={values.hours} onChange={update} />
        </div>
        <Input label="Location" name="location" leading={MapPin} value={values.location} onChange={update} />
        <Select label="Status" name="status" value={values.status} onChange={update}>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
      </form>
    </Drawer>
  );
}

function UploadDrawer({ event, open, onClose }) {
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const addFiles = (list) => setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 10));

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      toast.warn("Choose at least one photo.");
      return;
    }
    setUploading(true);
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    if (caption.trim()) form.append("caption", caption.trim());
    try {
      await api.post(`/api/teacher/${event._id}/uploadimages`, form);
      toast.success(`${files.length} ${files.length === 1 ? "photo" : "photos"} uploaded.`);
      setFiles([]);
      setCaption("");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't upload those photos."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Memories"
      title={`Add photos — ${event?.title || ""}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button type="submit" form="teacher-upload-images" loading={uploading}>
            Upload
          </Button>
        </>
      }
    >
      <form id="teacher-upload-images" onSubmit={submit} className="space-y-5" noValidate>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="rounded-xl border border-dashed border-line-strong bg-canvas p-6 text-center"
        >
          <ImagePlus aria-hidden="true" className="mx-auto size-6 text-muted" />
          <p className="mt-3 text-[14px] font-semibold text-fg">
            Drop photos here or{" "}
            <label className="link-draw cursor-pointer text-brand-700">
              browse
              <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </label>
          </p>
          <p className="mt-1 text-[12.5px] text-muted">Up to 10 photos, for the public gallery.</p>
        </div>
        {files.length ? (
          <ul className="grid grid-cols-4 gap-2">
            {files.map((file, i) => (
              <li key={i} className="relative aspect-square overflow-hidden rounded-lg bg-mist">
                {/* eslint-disable-next-line @next/next/no-img-element -- local file preview */}
                <img src={URL.createObjectURL(file)} alt="" className="size-full object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
        <Input label="Caption" hint="Applied to all photos in this batch." value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What does this show?" />
      </form>
    </Drawer>
  );
}

export default function MyEventsTeacher() {
  const events = useMyEvents();
  const tabsId = useId();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(null);

  const all = useMemo(() => events.data || [], [events.data]);
  const counts = useMemo(() => {
    const out = { all: all.length, Upcoming: 0, Ongoing: 0, Completed: 0 };
    all.forEach((e) => {
      if (out[e.status] != null) out[e.status] += 1;
    });
    return out;
  }, [all]);

  const q = query.trim().toLowerCase();
  const rows = sortEvents(all.filter((e) => (filter === "all" || e.status === filter) && (!q || e.title.toLowerCase().includes(q))));

  return (
    <>
      <PageHeader eyebrow="Events" title="My events" description="Events you're assigned to as a teacher. Update details or add photos from the drive." />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Tabs id={tabsId} value={filter} onChange={setFilter} label="Filter events" tabs={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} className="flex-1" />
        <SearchInput value={query} onChange={setQuery} placeholder="Search events" className="w-full lg:w-72" />
      </div>

      <div {...tabPanelProps(tabsId, filter)}>
        {events.loading ? (
          <CardGridSkeleton count={4} />
        ) : events.status === "error" ? (
          <ErrorState error={events.error} onRetry={events.reload} />
        ) : rows.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((event) => (
              <li key={event._id} className="flex flex-col rounded-xl border border-line bg-paper p-5">
                <div className="flex items-start gap-3">
                  <DateBlock date={event.date} size="sm" />
                  <div className="min-w-0 flex-1">
                    <StatusBadge status={event.status} label={event.status === "Ongoing" ? "Live" : undefined} size="sm" />
                    <p className="mt-2 truncate text-[15px] font-semibold text-fg">{event.title}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                  <li className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="size-3.5" /> {event.location || "No location"}
                  </li>
                  {event.institution ? (
                    <li className="flex items-center gap-2">
                      <Users aria-hidden="true" className="size-3.5" /> {event.institution}
                    </li>
                  ) : null}
                </ul>
                <div className="mt-auto flex gap-2 border-t border-line pt-4">
                  <Button size="sm" variant="outline" icon={Pencil} onClick={() => setEditing(event)} className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" icon={ImagePlus} onClick={() => setUploading(event)} className="flex-1">
                    Photos
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarRange} title={q ? "No matches" : "No events yet"} description={q ? "Try a different name." : "Events you're assigned to will appear here."} />
        )}
      </div>

      <EditDrawer
        event={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          events.mutate((list) => (list || []).map((e) => (e._id === updated._id ? { ...e, ...updated } : e)));
          setEditing(null);
        }}
      />
      <UploadDrawer event={uploading} open={Boolean(uploading)} onClose={() => setUploading(null)} />
    </>
  );
}
