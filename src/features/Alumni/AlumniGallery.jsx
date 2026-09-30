"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { Modal } from "@/components/ui/Dialog";
import PageHeader from "@/components/ui/PageHeader";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";

// Photos from the alumni's own institution, taken from its events. (The dedicated
// /api/alumni/allinstituteimages route is guarded by both alumniOnly and
// superAdminOnly, so no account can ever reach it.)
async function loadImages() {
  const res = await api.get("/api/alumni/getalleventsalumniinstituition");
  return (res.data?.events || []).flatMap((event) =>
    (event.images || []).map((img) => ({ id: img._id || img.url, url: img.url, caption: img.caption, eventTitle: event.title, eventDate: event.date }))
  );
}

export default function AlumniGallery() {
  const images = useResource(loadImages, []);
  const [open, setOpen] = useState(null);
  const rows = images.data || [];

  return (
    <>
      <PageHeader eyebrow="Community" title="Gallery" description="Moments from your institution's drives, shared by the students serving now." />
      {images.loading ? (
        <CardGridSkeleton count={6} />
      ) : images.status === "error" ? (
        <ErrorState error={images.error} onRetry={images.reload} />
      ) : rows.length ? (
        <ul className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {rows.map((img) => (
            <li key={img.id} className="mb-4 break-inside-avoid">
              <button type="button" onClick={() => setOpen(img)} className="group block w-full overflow-hidden rounded-lg bg-mist text-left" aria-label={`Open photo from ${img.eventTitle}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary upload shown at natural aspect */}
                <img src={img.url} alt={img.caption || img.eventTitle} loading="lazy" className="w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
              </button>
              <p className="mt-2 flex justify-between gap-3 text-[12.5px]">
                <span className="truncate font-semibold text-fg">{img.eventTitle}</span>
                <span className="shrink-0 text-muted">{formatDate(img.eventDate)}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Images} title="No photos yet" description="When volunteers and teachers upload photos from drives, they appear here." />
      )}

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} size="xl" title={open?.eventTitle || ""} description={open ? [open.caption, formatDate(open.eventDate)].filter(Boolean).join(" · ") : ""}>
        {open ? (
          // eslint-disable-next-line @next/next/no-img-element -- full-size view of an upload
          <img src={open.url} alt={open.caption || open.eventTitle} className="max-h-[70vh] w-full rounded-lg object-contain" />
        ) : null}
      </Modal>
    </>
  );
}
