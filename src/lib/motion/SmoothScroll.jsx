"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, MEDIA } from "./gsap";

const LenisContext = createContext({ current: null });

// The single Lenis instance for the public site. Application areas scroll
// inside their own containers and deliberately do not mount this.
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia(MEDIA.reduce).matches) return undefined;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.12,
      wheelMultiplier: 1,
      allowNestedScroll: true,
      anchors: { offset: -84 },
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}

export function useLenis() {
  return useContext(LenisContext);
}

export function scrollToTarget(lenisRef, target) {
  const lenis = lenisRef?.current;
  if (lenis) {
    lenis.scrollTo(target, { offset: -84, duration: 1.2 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (el?.scrollIntoView) el.scrollIntoView({ block: "start" });
  else if (typeof target === "number") window.scrollTo(0, target);
}
