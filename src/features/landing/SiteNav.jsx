"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useDialogBehaviour, useIsClient } from "@/components/ui/Dialog";
import { gsap, useIsoLayoutEffect } from "@/lib/motion/gsap";
import cx from "@/lib/cx";
import { SIGNUP_ROLES } from "./content";

const EXPO = [0.16, 1, 0.3, 1];

function JoinMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="join-menu"
        onClick={() => setOpen((v) => !v)}
        className="group/btn relative isolate inline-flex h-10 items-center gap-2 overflow-hidden rounded-lg bg-ink px-4 text-[13px] font-semibold text-paper transition-colors duration-300 before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-brand before:transition-transform before:duration-500 before:ease-out-expo hover:text-ink hover:before:scale-y-100 aria-expanded:text-ink aria-expanded:before:scale-y-100"
      >
        Get started
        <ChevronDown aria-hidden="true" className={cx("size-4 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id="join-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EXPO }}
            className="absolute right-0 top-[calc(100%+10px)] w-80 overflow-hidden rounded-xl border border-line bg-paper p-1.5 shadow-elevated"
          >
            <p className="eyebrow px-3 pb-2 pt-2.5 text-[0.62rem] text-subtle">Join Synapsis as</p>
            <ul>
              {SIGNUP_ROLES.map((item) => (
                <li key={item.role}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-canvas focus-visible:bg-canvas"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-fg">{item.role}</span>
                      <span className="block text-[12.5px] text-muted">{item.blurb}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ open, onClose, links }) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  useDialogBehaviour(open, panelRef, onClose);

  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          tabIndex={-1}
          className="fixed inset-0 z-(--z-drawer) flex flex-col overflow-y-auto bg-ink text-white outline-none"
          initial={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduce ? 0 : 1 }}
          animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
          exit={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduce ? 0 : 1 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="container-editorial flex h-18 shrink-0 items-center justify-between">
            <Logo tone="dark" size="sm" />
            <button
              type="button"
              onClick={onClose}
              data-autofocus
              aria-label="Close menu"
              className="flex size-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <nav aria-label="Primary" className="container-editorial mt-6 flex-1">
            <ul className="border-t border-white/10">
              {links.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: EXPO }}
                  className="border-b border-white/10"
                >
                  <a href={link.href} onClick={onClose} className="flex items-baseline justify-between py-4">
                    <span className="text-[2rem] font-semibold tracking-[-0.03em]">{link.label}</span>
                    <span className="tabular text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <p className="eyebrow mb-3 mt-10 text-white/45">Join as</p>
            <div className="grid grid-cols-2 gap-2">
              {SIGNUP_ROLES.map((item) => (
                <Link
                  key={item.role}
                  href={item.href}
                  className="flex h-12 items-center justify-between rounded-lg border border-white/15 px-4 text-sm font-semibold hover:border-brand hover:text-brand"
                >
                  {item.role}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              ))}
            </div>
          </nav>
          <div className="container-editorial py-8">
            <Link href="/login" className="flex h-14 items-center justify-center rounded-lg bg-brand text-[15px] font-semibold text-ink">
              Sign in
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default function SiteNav({ links }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef(null);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last) > 6) {
        setHidden(y > 520 && y > last);
        last = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useIsoLayoutEffect(() => {
    const bar = progressRef.current;
    if (!bar) return undefined;
    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-(--z-toast) rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header
        className={cx(
          "fixed inset-x-0 top-0 z-(--z-nav) transition-[transform,background-color,border-color] duration-500 ease-out-expo",
          scrolled ? "border-b border-line bg-paper/88 backdrop-blur-md" : "border-b border-transparent bg-transparent",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="container-editorial flex h-18 items-center justify-between gap-6">
          <Link href="/" aria-label="Synapsis home" className="shrink-0">
            <Logo size="sm" />
          </Link>
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link-draw py-1 text-[13.5px] font-medium text-fg-2 transition-colors hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <Link href="/login" className="link-draw text-[13.5px] font-semibold text-ink">
              Sign in
            </Link>
            <JoinMenu />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="-mr-2 flex size-11 items-center justify-center rounded-lg text-ink hover:bg-mist lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div aria-hidden="true" ref={progressRef} className="absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-brand" />
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={links} />
    </>
  );
}
