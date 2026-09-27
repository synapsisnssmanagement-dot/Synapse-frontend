import cx from "@/lib/cx";

// The serif italic accent — Synapsis's signature for the one word that matters.
export function Accent({ children, className }) {
  return <em className={cx("font-display font-normal italic tracking-[-0.01em] text-brand-700", className)}>{children}</em>;
}

export function Eyebrow({ children, className, tone = "muted" }) {
  return (
    <p
      className={cx(
        "eyebrow flex items-center gap-2.5",
        tone === "dark" ? "text-on-dark/55" : tone === "brand" ? "text-brand-700" : "text-muted",
        className
      )}
    >
      <span aria-hidden="true" className="h-px w-6 bg-brand" />
      {children}
    </p>
  );
}

export default function PageHeader({ eyebrow, title, description, actions, meta, className }) {
  return (
    <header className={cx("mb-8 flex flex-col gap-6 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
        <h1 className="text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-fg">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p> : null}
        {meta ? <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
