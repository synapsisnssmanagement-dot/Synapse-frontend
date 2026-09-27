"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";
import { useLenis } from "@/lib/motion/SmoothScroll";
import cx from "@/lib/cx";
import Button, { IconButton } from "./Button";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXPO = [0.16, 1, 0.3, 1];

// Only the top-most open dialog responds to Escape and Tab.
const openStack = [];

const subscribeNoop = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export function useDialogBehaviour(open, panelRef, onClose) {
  const lenisRef = useLenis();
  const onCloseRef = useRef(onClose);
  const id = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    openStack.push(id);

    const target = panel?.querySelector("[data-autofocus]") || panel;
    target?.focus({ preventScroll: true });

    const onKey = (event) => {
      if (openStack[openStack.length - 1] !== id || !panel) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = lenisRef?.current;
    lenis?.stop();

    return () => {
      document.removeEventListener("keydown", onKey);
      const index = openStack.lastIndexOf(id);
      if (index !== -1) openStack.splice(index, 1);
      if (!openStack.length) {
        document.body.style.overflow = previousOverflow;
        lenis?.start();
      }
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, id, panelRef, lenisRef]);
}

function DialogHeader({ title, description, titleId, descriptionId, onClose, eyebrow }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-2 text-brand-700">{eyebrow}</p> : null}
        <h2 id={titleId} className="text-xl font-semibold tracking-[-0.02em] text-fg">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <IconButton label="Close" icon={X} onClick={onClose} className="-mr-2 -mt-1" />
    </div>
  );
}

const modalSizes = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

export function Modal({ open, onClose, title, description, eyebrow, size = "md", footer, children, className }) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useDialogBehaviour(open, panelRef, onClose);

  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cx(
              "relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-paper shadow-elevated outline-none sm:rounded-2xl",
              modalSizes[size],
              className
            )}
            initial={{ y: reduce ? 0 : 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduce ? 0 : 16, opacity: 0 }}
            transition={{ duration: 0.4, ease: EXPO }}
          >
            <DialogHeader {...{ title, description, titleId, descriptionId, onClose, eyebrow }} />
            <div data-lenis-prevent className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
            {footer ? (
              <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-line bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

const drawerSizes = { md: "sm:max-w-md", lg: "sm:max-w-xl", xl: "sm:max-w-3xl" };

export function Drawer({ open, onClose, title, description, eyebrow, size = "md", side = "right", footer, children }) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useDialogBehaviour(open, panelRef, onClose);
  const offset = side === "right" ? "100%" : "-100%";

  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={cx("fixed inset-0 z-(--z-drawer) flex", side === "right" ? "justify-end" : "justify-start")}>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/55"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cx("relative flex h-dvh w-full flex-col bg-paper shadow-elevated outline-none", drawerSizes[size])}
            initial={{ x: reduce ? 0 : offset, opacity: reduce ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduce ? 0 : offset, opacity: reduce ? 0 : 1 }}
            transition={{ duration: 0.55, ease: EXPO }}
          >
            <div className="border-b border-line">
              <DialogHeader {...{ title, description, titleId, descriptionId, onClose, eyebrow }} />
            </div>
            <div data-lenis-prevent className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>
            {footer ? (
              <div className="flex flex-col-reverse gap-2 border-t border-line bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  children,
}) {
  const Icon = tone === "danger" ? AlertTriangle : Info;
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading} data-autofocus={tone === "danger" || undefined}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "dark"}
            onClick={onConfirm}
            loading={loading}
            data-autofocus={tone !== "danger" || undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={cx(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-mint text-brand-700"
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="text-sm leading-relaxed text-fg-2">
          {description}
          {children}
        </div>
      </div>
    </Modal>
  );
}
