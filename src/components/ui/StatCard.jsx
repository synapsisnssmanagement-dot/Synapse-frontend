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
        variant === "plain" && "rounded-2xl border border-line/70 bg-paper p-5 shadow-subtle",
        variant === "mint" && "rounded-2xl bg-mint p-5",
        feature && "overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-medium",
        variant === "inline" && "p-1",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cx("text-[13px] font-medium", feature ? "text-white/80" : "text-muted")}>{label}</p>
        {Icon ? (
          <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-xl", feature ? "bg-white/15" : "bg-mint")}>
            <Icon aria-hidden="true" className={cx("size-[18px]", feature ? "text-white" : "text-brand-600")} />
          </span>
        ) : null}
      </div>
      <div className={cx(align === "bottom" && "mt-auto pt-8")}>
        <p
          className={cx(
            "tabular mt-4 font-semibold tracking-[-0.045em]",
            feature ? "text-[clamp(2.5rem,4.5vw,3.5rem)] leading-none text-white" : "text-[2rem] leading-none text-fg"
          )}
        >
          {formatValue(value)}
          {unit ? <span className={cx("ml-1.5 text-base font-medium tracking-normal", feature ? "text-white/75" : "text-muted")}>{unit}</span> : null}
        </p>
        {delta != null || footnote ? (
          <div className={cx("mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]", feature ? "text-white/80" : "text-muted")}>
            {delta != null ? (
              <span
                className={cx(
                  "inline-flex items-center gap-1 font-semibold",
                  positive ? (feature ? "text-white" : "text-brand-700") : "text-red-600"
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
