import Image from "next/image";
import cx from "@/lib/cx";

export function SectionLabel({ index, children, tone = "light", className }) {
  return (
    <p
      data-reveal
      className={cx(
        "eyebrow flex items-center gap-3",
        tone === "dark" ? "text-on-dark/55" : tone === "brand" ? "text-ink/70" : "text-muted",
        className
      )}
    >
      <span className="tabular">{index}</span>
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-50" />
      {children}
    </p>
  );
}

const OPTIMISED_HOSTS = new Set(["res.cloudinary.com"]);

function canOptimise(src) {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    return OPTIMISED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

// next/image for local and Cloudinary assets; a plain lazy <img> for any other
// host, because next/image throws on hosts missing from remotePatterns.
export function SmartImage({ src, alt, sizes, className, priority = false }) {
  if (canOptimise(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cx("object-cover", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" className={cx("absolute inset-0 size-full object-cover", className)} />
  );
}

export function formatEventDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}
