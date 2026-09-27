import cx from "@/lib/cx";

export default function Progress({ value = 0, max = 100, label, valueLabel, size = "md", tone = "brand", dark = false, className }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cx("min-w-0", className)}>
      {label || valueLabel ? (
        <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
          {label ? <span className={cx("font-medium", dark ? "text-on-dark/80" : "text-fg-2")}>{label}</span> : <span />}
          {valueLabel ? <span className={cx("tabular font-semibold", dark ? "text-white" : "text-fg")}>{valueLabel}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-label={typeof label === "string" ? label : undefined}
        className={cx("overflow-hidden rounded-full", size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2", dark ? "bg-white/10" : "bg-mist")}
      >
        <div
          className={cx(
            "h-full rounded-full transition-[width] duration-700 ease-out-expo",
            tone === "brand" ? "bg-brand" : tone === "warning" ? "bg-warning" : tone === "danger" ? "bg-danger" : "bg-ink"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
