import { TrendingDown, TrendingUp } from "lucide-react";
import cx from "@/lib/cx";

function formatValue(value) {
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return value ?? "—";
}

// Variants are deliberately different compositions, not colour swaps:
//   plain    — quiet number on paper
//   feature  — the one headline number on the page, ink surface with emerald figure
//   mint     — soft brand wash for progress-type metrics
//   inline   — borderless, for use inside an existing panel
// align="bottom" anchors the figure to the foot of a stretched card.
export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  deltaLabel,
  footnote,
  variant = "plain",
  align = "top",
  className,
  children,
}) {
  const feature = variant === "feature";
  const positive = typeof delta === "number" ? delta >= 0 : null;
  return (
    <div
      className={cx(
        "relative flex min-w-0 flex-col",
        variant === "plain" && "rounded-xl border border-line bg-paper p-5",
        variant === "mint" && "rounded-xl border border-brand/20 bg-mint p-5",
        feature && "overflow-hidden rounded-2xl bg-ink p-6 text-on-dark",
        variant === "inline" && "p-1",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cx("eyebrow", feature ? "text-on-dark/55" : "text-muted")}>{label}</p>
        {Icon ? <Icon aria-hidden="true" className={cx("size-4 shrink-0", feature ? "text-brand" : "text-subtle")} /> : null}
      </div>
      <div className={cx(align === "bottom" && "mt-auto pt-8")}>
        <p
          className={cx(
            "tabular mt-4 font-semibold tracking-[-0.045em]",
            feature ? "text-[clamp(2.75rem,5vw,4rem)] leading-none text-brand" : "text-[2.1rem] leading-none text-fg"
          )}
        >
          {formatValue(value)}
          {unit ? <span className={cx("ml-1.5 text-base font-medium tracking-normal", feature ? "text-on-dark/60" : "text-muted")}>{unit}</span> : null}
        </p>
        {delta != null || footnote ? (
          <div className={cx("mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]", feature ? "text-on-dark/60" : "text-muted")}>
            {delta != null ? (
              <span
                className={cx(
                  "inline-flex items-center gap-1 font-semibold",
                  positive ? (feature ? "text-brand" : "text-brand-700") : "text-red-600"
                )}
              >
                {positive ? <TrendingUp aria-hidden="true" className="size-3.5" /> : <TrendingDown aria-hidden="true" className="size-3.5" />}
                {typeof delta === "number" ? `${delta > 0 ? "+" : ""}${delta}` : delta}
                {deltaLabel ? <span className="sr-only"> {deltaLabel}</span> : null}
              </span>
            ) : null}
            {footnote ? <span>{footnote}</span> : null}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
