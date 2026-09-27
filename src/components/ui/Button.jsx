import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import cx from "@/lib/cx";
import Spinner from "./Spinner";

const base =
  "group/btn relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-semibold tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out-expo active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

// Filled variants use a panel that sweeps up from the bottom on hover.
const sweep =
  "before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-500 before:ease-out-expo hover:before:scale-y-100 focus-visible:before:scale-y-100";

const variants = {
  primary: cx("bg-brand text-ink before:bg-ink hover:text-paper focus-visible:text-paper", sweep),
  dark: cx("bg-ink text-paper before:bg-brand hover:text-ink focus-visible:text-ink", sweep),
  light: cx("bg-paper text-ink before:bg-brand", sweep),
  outline: "border border-line-strong bg-paper text-fg hover:border-fg hover:bg-canvas",
  "outline-dark": "border border-white/20 text-on-dark hover:border-white/60 hover:bg-white/5",
  ghost: "text-fg-2 hover:bg-mist hover:text-fg",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-soft": "border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
};

const sizes = {
  sm: "h-9 rounded-md px-3.5 text-[13px]",
  md: "h-11 rounded-lg px-5 text-sm",
  lg: "h-14 rounded-lg px-7 text-[15px]",
  xl: "h-16 rounded-lg px-8 text-base",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  arrow = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  const classes = cx(base, variants[variant], sizes[size], fullWidth && "w-full", className);
  const content = (
    <>
      {loading ? <Spinner className="size-4" /> : Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      <span>{children}</span>
      {arrow && (
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-500 ease-out-expo group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled || undefined} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}

export function IconButton({ label, icon: Icon, variant = "ghost", size = "md", className, badge, ...props }) {
  const dims = { sm: "size-8", md: "size-10", lg: "size-12" }[size];
  const tone = {
    ghost: "text-fg-2 hover:bg-mist hover:text-fg",
    outline: "border border-line bg-paper text-fg-2 hover:border-line-strong hover:text-fg",
    dark: "text-on-dark/70 hover:bg-white/8 hover:text-white",
  }[variant];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45",
        dims,
        tone,
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-[18px]" />
      {badge ? (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-ink tabular">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}
