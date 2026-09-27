"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import useChoreography from "@/lib/motion/useChoreography";
import { SectionLabel } from "./parts";

const EXPO = [0.16, 1, 0.3, 1];

export default function Testimonials({ items, index: sectionIndex = "10" }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();
  const root = useChoreography([items.length]);

  if (!items.length) return null;
  const current = items[index];
  const go = (step) => {
    setDirection(step);
    setIndex((i) => (i + step + items.length) % items.length);
  };

  return (
    <section ref={root} id="voices" aria-labelledby="voices-title" aria-roledescription="carousel" className="relative bg-paper">
      <div className="container-editorial py-24 sm:py-32 lg:py-40">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3">
            <SectionLabel index={sectionIndex}>Voices</SectionLabel>
            <h2 id="voices-title" data-reveal className="mt-8 text-2xl font-semibold tracking-[-0.03em] text-ink">
              From the alumni who stayed connected.
            </h2>
            {items.length > 1 ? (
              <div data-reveal className="mt-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous story"
                  className="flex size-12 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next story"
                  className="flex size-12 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                >
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
                <span className="tabular ml-3 text-sm font-semibold text-muted" aria-live="polite">
                  {String(index + 1).padStart(2, "0")} <span className="text-subtle">/ {String(items.length).padStart(2, "0")}</span>
                </span>
              </div>
            ) : null}
          </div>

          <div className="relative min-h-[22rem] lg:col-span-8 lg:col-start-5">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.figure
                key={current.id}
                custom={direction}
                initial={{ opacity: 0, x: reduce ? 0 : direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : direction * -40 }}
                transition={{ duration: 0.6, ease: EXPO }}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${items.length}`}
              >
                <blockquote className="font-display leading-[1.08] tracking-[-0.02em] text-ink text-[clamp(1.9rem,3.6vw,3.4rem)]">
                  <span aria-hidden="true" className="mr-1 text-brand-700">
                    &ldquo;
                  </span>
                  {current.message}
                  <span aria-hidden="true" className="text-brand-700">
                    &rdquo;
                  </span>
                </blockquote>
                <figcaption className="mt-10 flex items-center gap-4 border-t border-line pt-6">
                  <Avatar src={current.image} name={current.name} size="lg" />
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{current.name}</p>
                    <p className="text-[13.5px] text-muted">
                      {[current.department, current.graduationYear && `Class of ${current.graduationYear}`].filter(Boolean).join(" · ") ||
                        "Synapsis alumni"}
                    </p>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
