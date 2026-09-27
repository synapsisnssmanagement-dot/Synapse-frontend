"use client";

import { useState } from "react";
import useChoreography from "@/lib/motion/useChoreography";
import { ScrollTrigger, useIsoLayoutEffect } from "@/lib/motion/gsap";
import { scrollToTarget, useLenis } from "@/lib/motion/SmoothScroll";
import cx from "@/lib/cx";

const PLATES = ["bg-mist", "bg-ink", "bg-mint", "bg-mist", "bg-ink", "bg-mint"];

export default function FeatureShowcase({ intro, items }) {
  const [active, setActive] = useState(0);
  const lenisRef = useLenis();
  const root = useChoreography([items.length]);

  useIsoLayoutEffect(() => {
    const blocks = Array.from(root.current?.querySelectorAll("[data-feature]") || []);
    if (!blocks.length) return undefined;
    // Derive the active item from positions, so fast jumps never leave a stale index.
    const sync = () => {
      const line = window.innerHeight * 0.55;
      let index = 0;
      blocks.forEach((block, i) => {
        if (block.getBoundingClientRect().top < line) index = i;
      });
      setActive(index);
    };
    const trigger = ScrollTrigger.create({
      trigger: blocks[0].parentElement,
      start: "top bottom",
      end: "bottom top",
      onUpdate: sync,
      onRefresh: sync,
    });
    return () => trigger.kill();
  }, [items.length]);

  return (
    <section ref={root} id="features" aria-labelledby="features-title" className="relative bg-paper">
      <div className="container-editorial pb-20 pt-24 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-44">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              {intro}
              <nav aria-label="Capabilities" className="mt-12 hidden lg:block">
                <ol className="border-t border-line">
                  {items.map((item, index) => (
                    <li key={item.title}>
                      <button
                        type="button"
                        aria-current={active === index ? "true" : undefined}
                        onClick={() => scrollToTarget(lenisRef, `#feature-${index + 1}`)}
                        className="group flex w-full items-center gap-4 border-b border-line py-3.5 text-left"
                      >
                        <span className={cx("tabular text-xs transition-colors", active === index ? "text-brand-700" : "text-subtle")}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cx(
                            "text-[15px] font-semibold tracking-[-0.015em] transition-colors duration-300",
                            active === index ? "text-ink" : "text-subtle group-hover:text-fg-2"
                          )}
                        >
                          {item.title}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cx(
                            "ml-auto h-px bg-brand transition-[width] duration-500 ease-out-expo",
                            active === index ? "w-10" : "w-0"
                          )}
                        />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>

          <div className="mt-16 space-y-24 sm:space-y-32 lg:col-span-7 lg:col-start-6 lg:mt-0 lg:space-y-44">
            {items.map((item, index) => (
              <article key={item.title} id={`feature-${index + 1}`} data-feature aria-labelledby={`feature-${index + 1}-title`}>
                <figure>
                  <div data-clip className={cx("relative overflow-hidden rounded-2xl px-5 py-10 sm:px-12 sm:py-16", PLATES[index % PLATES.length])}>
                    <div aria-hidden="true" inert className="mx-auto max-w-md">
                      {item.preview}
                    </div>
                  </div>
                  <figcaption className="sr-only">{item.alt}</figcaption>
                </figure>
                <div className="mt-8 grid gap-4 sm:grid-cols-[3rem_1fr]">
                  <span data-reveal className="tabular pt-2 text-sm font-semibold text-brand-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 id={`feature-${index + 1}-title`} data-reveal className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-tight tracking-[-0.035em] text-ink">
                      {item.title}
                    </h3>
                    <p data-reveal className="mt-4 max-w-xl text-[16px] leading-relaxed text-fg-2">
                      {item.text}
                    </p>
                    <ul data-reveal className="mt-6 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <li key={tag} className="rounded-sm border border-line px-2.5 py-1 text-[12px] font-medium text-muted">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
            <p className="text-[12.5px] text-subtle">Previews are illustrative. Names and figures are examples.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
