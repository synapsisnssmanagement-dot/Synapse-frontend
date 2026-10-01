"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cx from "@/lib/cx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_DOT = {
  Ongoing: "bg-brand",
  Upcoming: "bg-blue-500",
  Completed: "bg-slate-400",
  Cancelled: "bg-red-400",
};

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

// Generic month grid: events need {id, date, title, status}. Selecting a day
// shows that day's events in a side list; clicking one calls onSelectEvent.
export default function MonthCalendar({ events = [], onSelectEvent }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const byDay = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => buildGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const today = new Date();
  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const dayEvents = (d) => byDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) || [];
  const selected = selectedDay ? dayEvents(selectedDay) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="rounded-xl border border-line bg-paper p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-fg">{monthLabel}</p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
              className="flex size-8 items-center justify-center rounded-lg border border-line text-fg-2 hover:border-line-strong"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
              className="flex size-8 items-center justify-center rounded-lg border border-line text-fg-2 hover:border-line-strong"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11.5px] font-semibold text-subtle">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1.5">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = sameDay(d, today);
            const isSelected = selectedDay && sameDay(d, selectedDay);
            const dayList = dayEvents(d);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={cx(
                  "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border p-1.5 text-[13px] transition-colors",
                  isSelected ? "border-ink bg-ink text-white" : "border-transparent hover:border-line",
                  !inMonth && !isSelected && "text-subtle/50"
                )}
              >
                <span className={cx("tabular font-medium", isToday && !isSelected && "flex size-5 items-center justify-center rounded-full bg-brand text-white")}>
                  {d.getDate()}
                </span>
                {dayList.length ? (
                  <span className="flex gap-0.5">
                    {dayList.slice(0, 3).map((e) => (
                      <span key={e.id} className={cx("size-1.5 rounded-full", isSelected ? "bg-white" : STATUS_DOT[e.status] || "bg-ink")} />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="eyebrow mb-3 text-muted">{selectedDay ? selectedDay.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Select a day"}</p>
        {selectedDay && selected.length ? (
          <ul className="space-y-2">
            {selected.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent?.(e)}
                  className="w-full rounded-lg border border-line p-3 text-left transition-colors hover:border-ink"
                >
                  <p className="truncate text-[13.5px] font-semibold text-fg">{e.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{e.status}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">{selectedDay ? "No events on this day." : "Tap a date to see what's on."}</p>
        )}
      </div>
    </div>
  );
}
