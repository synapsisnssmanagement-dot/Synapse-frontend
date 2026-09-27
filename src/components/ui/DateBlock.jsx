import cx from "@/lib/cx";

export default function DateBlock({ date, size = "md", tone = "light", className }) {
  const d = date ? new Date(date) : null;
  const valid = d && !Number.isNaN(d.getTime());
  const day = valid ? String(d.getDate()).padStart(2, "0") : "--";
  const month = valid ? new Intl.DateTimeFormat("en-IN", { month: "short" }).format(d) : "TBA";
  const weekday = valid ? new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(d) : "";
  const dark = tone === "dark";
  return (
    <div
      className={cx(
        "flex shrink-0 flex-col items-center justify-center rounded-lg border text-center",
        size === "sm" ? "size-12" : "size-14",
        dark ? "border-white/10 bg-white/5 text-white" : "border-line bg-paper text-fg",
        className
      )}
      aria-label={valid ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(d) : "Date to be announced"}
    >
      <span aria-hidden="true" className={cx("text-[10px] font-semibold uppercase tracking-[0.12em]", dark ? "text-brand" : "text-brand-700")}>
        {month}
      </span>
      <span aria-hidden="true" className={cx("tabular font-semibold leading-none tracking-[-0.04em]", size === "sm" ? "text-lg" : "text-xl")}>
        {day}
      </span>
      {size !== "sm" && weekday ? (
        <span aria-hidden="true" className={cx("text-[10px]", dark ? "text-on-dark/50" : "text-muted")}>
          {weekday}
        </span>
      ) : null}
    </div>
  );
}
