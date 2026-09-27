"use client";

import { useId, useRef } from "react";
import { motion } from "framer-motion";
import cx from "@/lib/cx";

// ARIA tabs with roving focus. The parent owns `value` and renders the panel,
// spreading tabPanelProps(id, value) onto it with the same `id` it gave Tabs.
export default function Tabs({ id, tabs, value, onChange, className, label = "Sections" }) {
  const autoId = useId();
  const group = id || autoId;
  const refs = useRef({});

  const focusTab = (index) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    refs.current[tab.id]?.focus();
    onChange(tab.id);
  };

  const onKeyDown = (event, index) => {
    if (event.key === "ArrowRight") focusTab(index + 1);
    else if (event.key === "ArrowLeft") focusTab(index - 1);
    else if (event.key === "Home") focusTab(0);
    else if (event.key === "End") focusTab(tabs.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div role="tablist" aria-label={label} className={cx("scrollbar-quiet flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            role="tab"
            type="button"
            id={`${group}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${group}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cx(
              "relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-semibold transition-colors",
              selected ? "text-fg" : "text-muted hover:text-fg"
            )}
          >
            {tab.label}
            {tab.count != null ? (
              <span
                className={cx(
                  "tabular rounded-sm px-1.5 py-0.5 text-[11px] font-bold",
                  selected ? "bg-ink text-white" : "bg-mist text-fg-2"
                )}
              >
                {tab.count}
              </span>
            ) : null}
            {selected ? (
              <motion.span
                layoutId={`${group}-indicator`}
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-px h-0.5 bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(tabsGroupId, id) {
  return { role: "tabpanel", id: `${tabsGroupId}-panel-${id}`, "aria-labelledby": `${tabsGroupId}-tab-${id}`, tabIndex: 0 };
}
