"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import Button from "@/components/ui/Button";
import Magnetic from "@/lib/motion/Magnetic";
import { gsap, MEDIA, EASE, useIsoLayoutEffect } from "@/lib/motion/gsap";

const PROMISES = [
  ["01", "Volunteer hours, counted from real attendance"],
  ["02", "Every drive planned, staffed and remembered"],
  ["03", "Alumni mentors, one request away"],
];

export default function Hero() {
  const root = useRef(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const mm = gsap.matchMedia();

    mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, (context) => {
      const { motion, desktop } = context.conditions;
      if (!motion) return;
      const q = (s) => el.querySelectorAll(s);

      // Explicit fromTo end states: the pre-paint CSS guard hides [data-intro], and
      // GSAP reads a visibility:hidden element's autoAlpha as 0, so from() would
      // animate these elements *to* invisible.
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });
      tl.set(q("[data-intro]:not([data-rise])"), { autoAlpha: 1 })
        .fromTo(q("[data-intro-meta]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.05)
        .fromTo(q("[data-line]"), { yPercent: 118 }, { yPercent: 0, duration: 1.35, stagger: 0.12 }, 0.15)
        .fromTo(
          q("[data-hero-frame]"),
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE.inOut },
          0.35
        )
        .fromTo(q("[data-hero-img]"), { scale: 1.32 }, { scale: 1, duration: 2.1 }, 0.35)
        .fromTo(q("[data-rise]"), { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.8)
        .fromTo(q("[data-rule]"), { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 1.4, ease: EASE.inOut }, 0.9)
        .fromTo(q("[data-promise]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1.05);

      if (desktop) {
        gsap.to(q("[data-hero-img]"), {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(q("[data-hero-drift]"), {
          yPercent: 14,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: { trigger: el, start: "30% top", end: "bottom top", scrub: true },
        });
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative overflow-hidden bg-paper pt-24 lg:pt-28">
      <div className="container-editorial">
        <div data-intro className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <p data-intro-meta className="eyebrow text-muted">
            National Service Scheme<span className="hidden sm:inline"> <span className="text-subtle">/</span> Management platform</span>
          </p>
          <p data-intro-meta className="eyebrow hidden text-muted sm:block">
            The NSS motto <span className="text-subtle">/</span> since 1969
          </p>
        </div>

        <div data-hero-drift className="relative grid grid-cols-12 gap-x-4 pt-8 sm:pt-10 lg:gap-x-6">
          <h1
            id="hero-title"
            data-intro
            className="relative z-10 col-span-12 font-extrabold uppercase text-ink text-display-2xl lg:col-start-1 lg:row-start-1"
          >
            <span className="sr-only">Not me, but you. Synapsis — the NSS management platform.</span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.02em]">
              <span data-line className="block">
                Not me,
              </span>
            </span>
            <span aria-hidden="true" className="block overflow-hidden pb-[0.1em] lg:pl-[0.9em] xl:pl-[1.2em]">
              <span data-line className="block font-display font-normal normal-case italic tracking-[-0.035em] text-brand-700">
                but you.
              </span>
            </span>
          </h1>

          <figure
            data-intro
            className="col-span-12 mt-8 sm:col-span-8 sm:col-start-5 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:mt-[15vw]"
          >
            <div data-hero-frame data-cursor="Serve" className="relative aspect-[4/3] overflow-hidden bg-mist lg:aspect-[4/5]">
              <div data-hero-img className="absolute inset-[-6%_0]">
                <Image
                  src="/Images/IMG2.png"
                  alt="An NSS volunteer handing a meal to an elderly woman at a food distribution drive"
                  fill
                  priority
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 60vw, 92vw"
                  className="object-cover object-[50%_30%]"
                />
              </div>
            </div>
            <figcaption data-intro-meta className="mt-3 flex items-baseline justify-between gap-4 text-[12.5px] text-muted">
              <span className="eyebrow shrink-0 text-[0.62rem] text-subtle">Fig. 01</span>
              <span>Food distribution drive, volunteers at work</span>
            </figcaption>
          </figure>

          <div className="col-span-12 mt-10 grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:row-start-2 lg:mt-14 lg:gap-12">
            <p data-intro data-rise className="max-w-md text-[17px] leading-relaxed text-fg-2 lg:text-lg">
              Synapsis is where NSS service becomes impact. Plan drives, mark attendance, count every volunteer hour and keep
              your alumni close — in one place built for the whole unit.
            </p>
            <div data-intro data-rise className="flex flex-col items-start gap-5 sm:pt-1">
              <Magnetic>
                <Button href="#join" size="lg" arrow>
                  Get started
                </Button>
              </Magnetic>
              <Link href="/login" className="link-draw text-sm font-semibold text-ink">
                Already a member? Sign in
              </Link>
            </div>
          </div>
        </div>

        <div data-intro className="relative mt-16 lg:mt-24">
          <div data-rule className="h-px bg-line" />
          <ul className="grid grid-cols-1 sm:grid-cols-3">
            {PROMISES.map(([index, text]) => (
              <li
                key={index}
                data-promise
                className="flex items-baseline gap-4 border-b border-line py-5 text-[14px] font-medium text-fg-2 sm:border-b-0 sm:border-r sm:pr-6 sm:last:border-r-0 sm:[&:not(:first-child)]:pl-6"
              >
                <span className="tabular text-xs text-subtle">{index}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
