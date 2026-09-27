"use client";

import { useEffect, useRef } from "react";
import { gsap, MEDIA } from "./gsap";

// A label that follows the pointer only over elements that declare
// data-cursor="View". The system cursor is never hidden.
export default function Cursor() {
  const ref = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!window.matchMedia(MEDIA.finePointer).matches || window.matchMedia(MEDIA.reduce).matches) return undefined;

    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });
    let active = null;

    const move = (event) => {
      xTo(event.clientX);
      yTo(event.clientY);
    };

    const over = (event) => {
      const target = event.target.closest?.("[data-cursor]");
      if (target === active) return;
      active = target;
      if (target) {
        labelRef.current.textContent = target.dataset.cursor;
        gsap.to(el, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "expo.out" });
      } else {
        gsap.to(el, { scale: 0, autoAlpha: 0, duration: 0.3, ease: "power3.out" });
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-(--z-cursor) invisible flex size-22 items-center justify-center rounded-full bg-brand text-ink"
    >
      <span ref={labelRef} className="eyebrow text-[0.66rem]" />
    </div>
  );
}
