"use client";

import cx from "@/lib/cx";

export const CHART_COLORS = {
  brand: "#10b981",
  brandDeep: "#047857",
  ink: "#0a0f1a",
  slate: "#94a3b8",
  mist: "#e2e8f0",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "#64748b", fontSize: 12 },
};

export const gridProps = {
  stroke: "#e2e8f0",
  strokeDasharray: "3 4",
  vertical: false,
};

export function ChartTooltip({ active, payload, label, labelFormatter, valueSuffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg border border-line bg-paper px-3 py-2.5 shadow-elevated">
      {label != null ? <p className="mb-1.5 text-[12px] font-semibold text-fg">{labelFormatter ? labelFormatter(label) : label}</p> : null}
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.dataKey || item.name} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-2 text-muted">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: item.color || item.payload?.fill }} />
              {item.name}
            </span>
            <span className="tabular font-semibold text-fg">
              {item.value}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items, className }) {
  return (
    <ul className={cx("flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-muted">
          <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
          {item.value != null ? <span className="tabular font-semibold text-fg">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}
