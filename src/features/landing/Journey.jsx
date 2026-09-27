"use client";

import { useRef } from "react";
import { Award } from "lucide-react";
import { gsap, MEDIA, useIsoLayoutEffect } from "@/lib/motion/gsap";
import cx from "@/lib/cx";
import { SectionLabel } from "./parts";

// Thresholds mirror the backend's completeEvent level rules.
const LEVELS = [
  {
    name: "Bronze",
    from: "Your first hour",
    hours: 0,
    text: "The first completed event starts a record that follows you through college — every drive, every hour.",
    swatch: "bg-orange-300",
  },
  {
    name: "Silver",
    from: "11 hours",
    hours: 11,
    text: "Eleven hours in. You know how a drive runs, and the team knows your name.",
    swatch: "bg-slate-300",
  },
  {
    name: "Gold",
    from: "26 hours",
    hours: 26,
    text: "Twenty-six hours of showing up — weekend after weekend, drive after drive.",
    swatch: "bg-amber-300",
  },
  {
    name: "Platinum",
    from: "50 hours",
    hours: 50,
    text: "Fifty hours and beyond. The highest level Synapsis awards, recorded on your certificate trail.",
    swatch: "bg-brand",
  },
];

export default function Journey() {
  const root = useRef(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const mm = gsap.matchMedia();
    mm.add(`${MEDIA.desktop} and ${MEDIA.motion}`, () => {
      const track = el.querySelector("[data-track]");
      const fill = el.querySelector("[data-fill]");
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el.querySelector("[data-pin]"),
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      tl.to(track, { x: () => -distance(), ease: "none" }, 0).fromTo(fill, { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
      el.querySelectorAll("[data-level-name]").forEach((name) => {
        gsap.from(name, {
          yPercent: 40,
          autoAlpha: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: name,
            containerAnimation: tl,
            start: "left 95%",
            end: "left 55%",
            scrub: true,
          },
        });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="journey" aria-labelledby="journey-title" className="relative bg-ink text-on-dark">
      <div data-pin className="overflow-hidden lg:motion-safe:flex lg:motion-safe:h-dvh lg:motion-safe:flex-col lg:motion-safe:justify-center">
        <div className="container-editorial pt-24 sm:pt-32 lg:motion-safe:pt-0">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel index="07" tone="dark">
                The volunteer journey
              </SectionLabel>
              <h2 id="journey-title" className="mt-8 max-w-[16ch] font-semibold text-white text-display-lg">
                Every hour moves you <em className="font-display font-normal italic text-brand">forward.</em>
              </h2>
            </div>
            <p className="max-w-sm text-[15px] leading-relaxed text-on-dark/60">
              Levels are awarded automatically when an event is completed and your attendance is recorded. No forms, no waiting.
            </p>
          </div>
        </div>

        <div className="relative mt-14 pb-24 sm:pb-32 lg:mt-16 lg:motion-safe:pb-0">
          <div
            data-track
            className="container-editorial grid gap-px sm:grid-cols-2 lg:motion-safe:flex lg:motion-safe:w-max lg:motion-safe:max-w-none lg:motion-safe:gap-0"
          >
            {LEVELS.map((level, i) => (
              <article
                key={level.name}
                className="relative flex min-h-[320px] flex-col justify-between border-t border-white/10 py-10 sm:pr-10 lg:motion-safe:h-[52vh] lg:motion-safe:min-h-[380px] lg:motion-safe:w-[46vw] lg:motion-safe:border-l lg:motion-safe:border-t-0 lg:motion-safe:px-12 lg:motion-safe:first:border-l-0 lg:motion-safe:first:pl-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className={cx("size-2.5 rounded-full", level.swatch)} />
                    <span className="eyebrow text-on-dark/55">Level {String(i + 1).padStart(2, "0")}</span>
                  </span>
                  <span className="tabular text-sm font-semibold text-white">{level.from}</span>
                </div>
                <div className="overflow-hidden py-2">
                  <h3 data-level-name className="font-extrabold uppercase text-white text-display-xl">
                    {level.name}
                  </h3>
                </div>
                <p className="max-w-md text-[15.5px] leading-relaxed text-on-dark/65">{level.text}</p>
              </article>
            ))}
            <div className="hidden lg:motion-safe:flex lg:motion-safe:w-[34vw] lg:motion-safe:flex-col lg:motion-safe:justify-center lg:motion-safe:px-12">
              <Award aria-hidden="true" className="size-10 text-brand" />
              <p className="mt-6 max-w-xs text-2xl font-semibold leading-snug tracking-[-0.02em] text-white">
                Each level is reflected on your dashboard and your certificates.
              </p>
            </div>
          </div>

          <div aria-hidden="true" className="container-editorial mt-12 hidden lg:motion-safe:block">
            <div className="relative h-0.5 bg-white/10">
              <div data-fill className="absolute inset-0 origin-left bg-brand" />
            </div>
            <div className="tabular mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-on-dark/45">
              <span>0 h</span>
              <span>11 h</span>
              <span>26 h</span>
              <span>50 h +</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
