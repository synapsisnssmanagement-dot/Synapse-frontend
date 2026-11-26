import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import cx from "@/lib/cx";
import Spinner from "./Spinner";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants = {
  primary: "bg-brand-600 text-white shadow-[0_1px_2px_rgb(8_122_81/0.25),inset_0_1px_0_rgb(255_255_255/0.15)] hover:bg-brand-700",
  dark: "bg-ink text-white hover:bg-ink-800",
  light: "bg-paper text-ink shadow-subtle hover:bg-mint",
  outline: "border border-line-strong bg-paper text-fg shadow-subtle hover:border-brand-600/50 hover:bg-mint/60",
  "outline-dark": "border border-white/25 text-on-dark hover:border-white/60 hover:bg-white/10",
  ghost: "text-fg-2 hover:bg-mist hover:text-fg",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-soft": "bg-rose text-red-700 hover:bg-red-100",
};

const sizes = {
  sm: "h-9 rounded-lg px-3.5 text-[13px]",
  md: "h-11 rounded-xl px-5 text-sm",
  lg: "h-13 rounded-xl px-7 text-[15px]",
  xl: "h-15 rounded-2xl px-8 text-base",
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
    soft: "text-muted hover:bg-mist hover:text-fg",
  }[variant];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45",
        dims,
        tone,
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-[18px]" />
      {badge ? (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-paper tabular">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}
