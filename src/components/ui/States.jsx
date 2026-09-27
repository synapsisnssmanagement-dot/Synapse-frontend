import { CloudOff, Inbox, RotateCw } from "lucide-react";
import cx from "@/lib/cx";
import { errorMessage } from "@/lib/errors";
import Button from "./Button";

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, size = "md", tone = "light" }) {
  const dark = tone === "dark";
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "px-4 py-10" : "px-6 py-16 sm:py-20",
        className
      )}
    >
      <span
        className={cx(
          "relative mb-5 flex size-12 items-center justify-center rounded-xl border",
          dark ? "border-white/10 bg-white/5 text-brand" : "border-brand/20 bg-mint text-brand-700"
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className={cx("text-[17px] font-semibold tracking-[-0.015em]", dark ? "text-white" : "text-fg")}>{title}</h3>
      {description ? (
        <p className={cx("mt-2 max-w-sm text-sm leading-relaxed", dark ? "text-on-dark/60" : "text-muted")}>{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  className,
  size = "md",
}) {
  const detail = description || (error ? errorMessage(error) : "We couldn't load this right now.");
  return (
    <div
      role="alert"
      className={cx(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "px-4 py-10" : "px-6 py-16 sm:py-20",
        className
      )}
    >
      <span className="mb-5 flex size-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
        <CloudOff aria-hidden="true" className="size-5" />
      </span>
      <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-fg">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{detail}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" icon={RotateCw} onClick={onRetry} className="mt-6">
          Try again
        </Button>
      ) : null}
    </div>
  );
}

// Renders exactly one of: skeleton, error, empty, or the content.
export function AsyncView({ resource, skeleton, isEmpty, empty, errorTitle, errorDescription, children }) {
  const { status, data, error, reload } = resource;
  if (status === "loading" || status === "idle") return skeleton ?? null;
  if (status === "error" && data == null) {
    return <ErrorState title={errorTitle} description={errorDescription} error={error} onRetry={reload} />;
  }
  const emptyCheck = isEmpty ?? ((value) => value == null || (Array.isArray(value) && value.length === 0));
  if (emptyCheck(data)) return empty ?? null;
  return typeof children === "function" ? children(data) : children;
}
