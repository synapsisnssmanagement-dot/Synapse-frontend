"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import useResource from "@/hooks/useResource";
import api from "@/lib/api";
import cx from "@/lib/cx";

const DISMISS_KEY = "synapsis.setup.dismissed";

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Guided first-run setup. Each step is derived from live data, so it ticks
// itself off as the coordinator completes it, and disappears when all are done.
export default function SetupChecklist({ volunteers = 0, events = 0 }) {
  const [dismissed, setDismissed] = useState(readDismissed);
  const units = useResource(() => api.get("/api/ops/units").then((r) => r.data?.units || []).catch(() => null), []);
  const officers = useResource(() => api.get("/api/ops/officers").then((r) => r.data || {}).catch(() => null), []);

  if (dismissed || units.loading || officers.loading) return null;

  const steps = [
    {
      title: "Set up your institution",
      body: "Add your units and service-hour policy so hours are counted correctly.",
      href: "/coordinatorlayout/policies",
      done: (units.data?.length || 0) > 0,
    },
    {
      title: "Add your teachers",
      body: "Invite programme officers and teachers so they can mark attendance.",
      href: "/coordinatorlayout/manageteacher",
      done: (officers.data?.teachers?.length || 0) > 0,
    },
    {
      title: "Enrol volunteers",
      body: "Approve students into your NSS unit.",
      href: "/coordinatorlayout/managevolunteer",
      done: volunteers > 0,
    },
    {
      title: "Create your first event",
      body: "Schedule a drive. Volunteers can then check in on the day.",
      href: "/coordinatorlayout/createevent",
      done: events > 0,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Preference only.
    }
    setDismissed(true);
  };

  return (
    <section aria-labelledby="setup-title" className="mb-4 rounded-xl border border-line bg-paper p-5 shadow-subtle sm:p-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-brand-700">Getting started</p>
          <h2 id="setup-title" className="mt-1.5 text-lg font-semibold text-fg">
            Get your unit ready, {doneCount} of {steps.length} done
          </h2>
          <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide setup checklist"
          className="rounded-md p-1.5 text-subtle transition-colors hover:bg-mist hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, i) => {
          const isNext = step === next;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className={cx(
                  "group flex h-full gap-3 rounded-lg border p-3.5 transition-colors",
                  step.done ? "border-line bg-canvas" : isNext ? "border-brand/40 bg-mint hover:border-brand" : "border-line hover:border-line-strong"
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                    step.done ? "bg-brand text-white" : isNext ? "bg-ink text-white" : "bg-mist text-muted"
                  )}
                >
                  {step.done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cx("flex items-center gap-1 text-[14px] font-semibold", step.done ? "text-muted line-through" : "text-fg")}>
                    {step.title}
                    {!step.done ? <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" /> : null}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{step.body}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
