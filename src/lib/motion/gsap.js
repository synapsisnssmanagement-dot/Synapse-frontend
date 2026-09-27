"use client";

import { useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px)",
  finePointer: "(hover: hover) and (pointer: fine)",
};

export const EASE = {
  out: "expo.out",
  soft: "power3.out",
  inOut: "power4.inOut",
};

export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export { gsap, ScrollTrigger, SplitText };
