"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, MEDIA, EASE, useIsoLayoutEffect } from "./gsap";

/*
  Declarative scroll choreography. Mark elements inside the returned ref:

    data-reveal              fade + rise when entering the viewport (batched stagger)
    data-split="lines"       masked line reveal for headlines ("words" also supported)
    data-split="scrub"       words brighten as the reader scrolls through the passage
    data-clip                image mask opens from the bottom; inner img settles from scale
    data-speed="-12"         parallax drift in yPercent (desktop only)
    data-count="50"          counts up on enter (data-count-pad="2" → "05")
    data-draw / ="y"         line draws along x (or y) as the section scrolls

  Nothing runs when the visitor prefers reduced motion, so the authored
  markup must already be the finished state.
*/
export default function useChoreography(deps = []) {
  const scope = useRef(null);

  useIsoLayoutEffect(() => {
    const root = scope.current;
    if (!root) return undefined;

    const mm = gsap.matchMedia();
    mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, (context) => {
      const { motion, desktop } = context.conditions;
      if (!motion) return undefined;
      const q = (selector) => Array.from(root.querySelectorAll(selector));
      const restores = [];

      const reveals = q("[data-reveal]");
      if (reveals.length) {
        gsap.set(reveals, { autoAlpha: 0, y: 36 });
        ScrollTrigger.batch(reveals, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE.out, stagger: 0.09, overwrite: true }),
        });
      }

      q("[data-split]").forEach((el) => {
        const mode = el.dataset.split || "lines";
        if (mode === "scrub") {
          SplitText.create(el, {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.words,
                { opacity: 0.18 },
                {
                  opacity: 1,
                  stagger: 0.12,
                  ease: "none",
                  scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: 0.6 },
                }
              ),
          });
          return;
        }
        const words = mode === "words";
        SplitText.create(el, {
          type: words ? "words,lines" : "lines",
          mask: words ? "words" : "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(words ? self.words : self.lines, {
              yPercent: 112,
              duration: 1.25,
              ease: EASE.out,
              stagger: words ? 0.045 : 0.1,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }),
        });
      });

      q("[data-clip]").forEach((el) => {
        const media = el.querySelector("img, video");
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 86%", once: true } });
        tl.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: EASE.inOut }
        );
        if (media) tl.fromTo(media, { scale: 1.22 }, { scale: 1, duration: 1.9, ease: EASE.out }, 0.05);
      });

      if (desktop) {
        q("[data-speed]").forEach((el) => {
          const speed = parseFloat(el.dataset.speed) || -10;
          gsap.fromTo(
            el,
            { yPercent: -speed / 2 },
            {
              yPercent: speed / 2,
              ease: "none",
              scrollTrigger: {
                trigger: el.closest("[data-speed-trigger]") || el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      }

      q("[data-count]").forEach((el) => {
        const original = el.textContent;
        const end = parseFloat(el.dataset.count) || 0;
        const pad = parseInt(el.dataset.countPad || "0", 10);
        const format = (value) => {
          const n = Math.round(value);
          return pad ? String(n).padStart(pad, "0") : n.toLocaleString("en-IN");
        };
        const counter = { value: 0 };
        el.textContent = format(0);
        gsap.to(counter, {
          value: end,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => {
            el.textContent = format(counter.value);
          },
        });
        restores.push(() => {
          el.textContent = original;
        });
      });

      q("[data-draw]").forEach((el) => {
        const vertical = el.dataset.draw === "y";
        gsap.fromTo(
          el,
          { [vertical ? "scaleY" : "scaleX"]: 0 },
          {
            [vertical ? "scaleY" : "scaleX"]: 1,
            ease: "none",
            transformOrigin: vertical ? "50% 0%" : "0% 50%",
            scrollTrigger: {
              trigger: el.closest("[data-draw-trigger]") || el,
              start: "top 78%",
              end: "bottom 62%",
              scrub: 0.5,
            },
          }
        );
      });

      return () => restores.forEach((restore) => restore());
    });

    return () => mm.revert();
  }, deps);

  return scope;
}
