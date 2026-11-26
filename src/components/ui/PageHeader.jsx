import cx from "@/lib/cx";

// The serif italic accent — Synapsis's signature for the one word that matters.
export function Accent({ children, className }) {
  return <em className={cx("not-italic text-brand-600", className)}>{children}</em>;
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
      <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
      {children}
    </p>
  );
}

export default function PageHeader({ eyebrow, title, description, actions, meta, className }) {
  return (
    <header className={cx("mb-5 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-2.5 hidden lg:flex">{eyebrow}</Eyebrow> : null}
        <h1 className="text-[1.5rem] lg:text-[clamp(1.6rem,2.6vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.025em] text-fg">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted lg:text-[15px]">{description}</p> : null}
        {meta ? <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
