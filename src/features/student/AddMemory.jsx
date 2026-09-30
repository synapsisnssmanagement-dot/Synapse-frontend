"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Images, X } from "lucide-react";
import { toast } from "sonner";
import Button, { IconButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import api, { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { sortEvents, useMyEvents } from "./data";

const MAX_FILES = 10;

function Previews({ files, onRemove }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {urls.map((url, i) => (
        <li key={url} className="relative aspect-square overflow-hidden rounded-lg bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element -- local file preview */}
          <img src={url} alt="" className="size-full object-cover" />
          <IconButton label={`Remove photo ${i + 1}`} icon={X} size="sm" onClick={() => onRemove(i)} className="absolute right-1 top-1 size-7 bg-paper/90" />
        </li>
      ))}
    </ul>
  );
}

export default function AddMemory() {
  const events = useMyEvents();
  const [eventId, setEventId] = useState("");
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const all = sortEvents(events.data || []);
  const selected = all.find((e) => e._id === eventId);
  const gallery = selected?.images || [];

  const add = (list) => {
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...images].slice(0, MAX_FILES));
  };

  const upload = async () => {
    setUploading(true);
    const form = new FormData();
    files.forEach((file) => form.append("images", file));
    if (caption.trim()) form.append("caption", caption.trim());
    try {
      const res = await api.post(`/api/students/${eventId}/uploadimagesbystudent`, form);
      const images = res.data?.images;
      if (images) events.mutate((list) => (list || []).map((e) => (e._id === eventId ? { ...e, images } : e)));
      toast.success(`${files.length} ${files.length === 1 ? "photo" : "photos"} added to ${selected.title}.`);
      setFiles([]);
      setCaption("");
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't upload those photos."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Service" title="Add a memory" description="Share photos from a drive. They appear in the event's gallery and the public album." />

      {events.loading ? (
        <CardGridSkeleton count={2} />
      ) : events.status === "error" ? (
        <ErrorState error={events.error} onRetry={events.reload} />
      ) : all.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Panel title="Upload photos">
            <div className="space-y-5">
              <Select
                label="Event"
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setFiles([]);
                }}
                placeholder="Choose an event"
              >
                {all.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title} — {formatDate(e.date, "short")}
                  </option>
                ))}
              </Select>
              {selected ? (
                <>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      add(e.dataTransfer.files);
                    }}
                    className="rounded-xl border border-dashed border-line-strong bg-canvas p-6 text-center"
                  >
                    <ImagePlus aria-hidden="true" className="mx-auto size-6 text-muted" />
                    <p className="mt-3 text-[14px] font-semibold text-fg">
                      Drop photos here or{" "}
                      <label className="link-draw cursor-pointer text-brand-700">
                        browse
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} />
                      </label>
                    </p>
                    <p className="mt-1 text-[12.5px] text-muted">Up to {MAX_FILES} photos at a time.</p>
                  </div>
                  {files.length ? <Previews files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, j) => j !== i))} /> : null}
                  <Input label="Caption" hint="Applied to every photo in this batch." placeholder="What was happening?" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  <Button fullWidth icon={ImagePlus} disabled={!files.length} loading={uploading} onClick={upload}>
                    {files.length ? `Upload ${files.length} ${files.length === 1 ? "photo" : "photos"}` : "Choose photos to upload"}
                  </Button>
                </>
              ) : null}
            </div>
          </Panel>

          <Panel title={selected ? `Gallery — ${selected.title}` : "Gallery"} description={selected ? `${gallery.length} photos so far` : "Choose an event to see its photos"}>
            {selected && gallery.length ? (
              <ul className="columns-2 gap-3 sm:columns-3">
                {gallery.map((img) => (
                  <li key={img._id || img.url} className="mb-3 break-inside-avoid">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary upload shown at natural aspect */}
                    <img src={img.url} alt={img.caption || selected.title} loading="lazy" className="w-full rounded-lg" />
                    {img.caption ? <p className="mt-1 text-[12px] text-muted">{img.caption}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState size="sm" icon={Images} title={selected ? "No photos yet" : "Nothing selected"} description={selected ? "Be the first to add one." : "Pick an event on the left."} />
            )}
          </Panel>
        </div>
      ) : (
        <EmptyState icon={Images} title="No events yet" description="You can add memories once you've been part of an event." />
      )}
    </>
  );
}
