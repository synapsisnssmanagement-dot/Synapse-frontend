"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useDialogBehaviour, useIsClient } from "@/components/ui/Dialog";
import useChoreography from "@/lib/motion/useChoreography";
import { SmartImage, formatEventDate } from "./parts";

function Lightbox({ images, index, onClose, onStep }) {
  const isClient = useIsClient();
  const panelRef = useRef(null);
  const open = index !== null;
  useDialogBehaviour(open, panelRef, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onStep]);

  if (!isClient) return null;
  const image = open ? images[index] : null;
  return createPortal(
    <AnimatePresence>
      {image ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={image.eventTitle || "Photograph"}
          tabIndex={-1}
          className="fixed inset-0 z-(--z-modal) flex flex-col bg-ink/96 text-white outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <p className="tabular text-sm font-semibold text-on-dark/60">
              {String(index + 1).padStart(2, "0")} <span className="text-on-dark/35">/ {String(images.length).padStart(2, "0")}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              data-autofocus
              aria-label="Close photo"
              className="flex size-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative size-full"
            >
              <SmartImage src={image.url} alt={image.caption || image.eventTitle || "NSS event photograph"} sizes="100vw" className="object-contain!" />
            </motion.div>
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => onStep(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onStep(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              </>
            ) : null}
          </div>
          <div className="px-4 py-5 text-center sm:px-8">
            <p className="text-[15px] font-semibold">{image.eventTitle || "NSS drive"}</p>
            <p className="mt-1 text-[13px] text-on-dark/55">
              {[image.caption, image.eventDate && formatEventDate(image.eventDate)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default function AlbumGrid({ images }) {
  const [index, setIndex] = useState(null);
  const root = useChoreography([images.length]);
  const step = (delta) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length));

  return (
    <div ref={root}>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {images.map((image, i) => (
          <li key={image.id} data-reveal className="mb-4 break-inside-avoid">
            <figure>
              <button
                type="button"
                data-cursor="View"
                onClick={() => setIndex(i)}
                aria-label={`Open photo${image.eventTitle ? ` from ${image.eventTitle}` : ""}`}
                className={`group relative block w-full overflow-hidden bg-mist ${["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]"][i % 4]}`}
              >
                <SmartImage
                  src={image.url}
                  alt={image.caption || image.eventTitle || "NSS event photograph"}
                  sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                  className="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.05]"
                />
              </button>
              <figcaption className="mt-2.5 flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="truncate font-semibold text-fg">{image.eventTitle || "NSS drive"}</span>
                {image.eventDate ? <span className="tabular shrink-0 text-muted">{formatEventDate(image.eventDate)}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={index} onClose={() => setIndex(null)} onStep={step} />
    </div>
  );
}
