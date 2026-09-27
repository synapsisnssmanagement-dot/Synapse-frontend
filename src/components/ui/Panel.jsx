import cx from "@/lib/cx";

export default function Panel({ title, description, actions, children, className, bodyClassName, padded = true, as: Tag = "section", id }) {
  const titleId = id ? `${id}-title` : undefined;
  return (
    <Tag id={id} aria-labelledby={title ? titleId : undefined} className={cx("min-w-0 rounded-xl border border-line bg-paper", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-[15px] font-semibold tracking-[-0.015em] text-fg">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cx(padded && "p-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}
