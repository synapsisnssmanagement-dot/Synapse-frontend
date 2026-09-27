"use client";

import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { useDialogBehaviour, useIsClient } from "@/components/ui/Dialog";
import cx from "@/lib/cx";
import { PROFILE_ICON } from "./nav";

function PaletteBody({ config, onClose }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const items = useMemo(() => {
    const all = [
      ...config.groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
      { label: "Profile", href: config.profile, icon: PROFILE_ICON, group: "Account" },
    ];
    const q = query.trim().toLowerCase();
    return q ? all.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(q)) : all;
  }, [config, query]);

  const active = Math.min(cursor, Math.max(items.length - 1, 0));

  const go = (item) => {
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter" && items[active]) {
      event.preventDefault();
      go(items[active]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <input
          data-autofocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
          aria-label="Jump to a page"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Jump to a page"
          className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
        />
        <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-muted">Esc</kbd>
      </div>
      <ul id={listId} role="listbox" aria-label="Pages" data-lenis-prevent className="scrollbar-quiet max-h-[min(60vh,420px)] overflow-y-auto p-2">
        {items.length ? (
          items.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.href}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseMove={() => setCursor(index)}
                onClick={() => go(item)}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                  index === active ? "bg-ink text-white" : "text-fg-2"
                )}
              >
                <Icon aria-hidden="true" className={cx("size-4 shrink-0", index === active ? "text-brand" : "text-subtle")} />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <span className={cx("text-[12px]", index === active ? "text-on-dark/55" : "text-subtle")}>{item.group}</span>
                {index === active ? <CornerDownLeft aria-hidden="true" className="size-3.5 text-on-dark/55" /> : null}
              </li>
            );
          })
        ) : (
          <li className="px-3 py-8 text-center text-sm text-muted">No pages match &ldquo;{query}&rdquo;.</li>
        )}
      </ul>
    </>
  );
}

export default function CommandPalette({ open, onClose, config }) {
  const isClient = useIsClient();
  const panelRef = useRef(null);
  useDialogBehaviour(open, panelRef, onClose);

  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-(--z-modal) flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Jump to a page"
            tabIndex={-1}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-paper shadow-elevated outline-none"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <PaletteBody config={config} onClose={onClose} />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
