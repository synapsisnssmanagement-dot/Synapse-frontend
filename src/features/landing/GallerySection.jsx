import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import cx from "@/lib/cx";
import Scene from "./Scene";
import { SectionLabel, SmartImage, formatEventDate } from "./parts";

const SPANS = [
  "sm:col-span-2 lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];

const FRAMES = [
  "aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:flex-1",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-square",
  "aspect-square",
];

export default function GallerySection({ images, index = "09" }) {
  if (!images.length) return null;
  const shown = images.slice(0, SPANS.length);
  return (
    <Scene id="gallery" aria-labelledby="gallery-title" className="relative bg-ink text-on-dark">
      <div className="container-editorial py-24 sm:py-32 lg:py-40">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel index={index} tone="dark">
              Memories
            </SectionLabel>
            <h2 id="gallery-title" data-split="lines" className="mt-8 font-semibold text-white text-display-lg">
              Proof that it <em className="font-display font-normal italic text-brand">happened.</em>
            </h2>
          </div>
          <Link href="/eventalbum" className="group inline-flex items-center gap-2 text-sm font-semibold text-white">
            <span className="link-draw">View the full album</span>
            <ArrowUpRight aria-hidden="true" className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12 lg:gap-4">
          {shown.map((image, i) => (
            <li key={image.id} className={cx("min-w-0", SPANS[i])}>
              <figure className="flex h-full flex-col">
                <Link
                  href="/eventalbum"
                  data-clip
                  data-cursor="View"
                  aria-label={`Open the album${image.eventTitle ? ` — ${image.eventTitle}` : ""}`}
                  className={cx("group relative block overflow-hidden bg-ink-800", FRAMES[i])}
                >
                  <SmartImage
                    src={image.url}
                    alt={image.caption || image.eventTitle || "NSS event photograph"}
                    sizes={i === 0 ? "(min-width: 1024px) 55vw, 92vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 46vw, 92vw"}
                    className="transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.05]"
                  />
                </Link>
                <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[12.5px]">
                  <span className="truncate font-medium text-on-dark/80">{image.eventTitle || image.caption || "NSS drive"}</span>
                  <span className="tabular shrink-0 text-on-dark/45">{image.eventDate ? formatEventDate(image.eventDate) : `Fig. ${String(i + 3).padStart(2, "0")}`}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </Scene>
  );
}
