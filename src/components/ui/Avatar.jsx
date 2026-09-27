"use client";

import { useState } from "react";
import cx from "@/lib/cx";

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-24 text-2xl",
  "2xl": "size-32 text-3xl",
};

const fills = ["bg-ink text-on-dark", "bg-brand-700 text-white", "bg-mint text-brand-700", "bg-mist text-fg-2"];

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function fillFor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return fills[hash % fills.length];
}

export default function Avatar({ src, name = "", size = "md", className, ring = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;
  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold tracking-tight",
        sizes[size],
        !showImage && fillFor(name),
        ring && "ring-2 ring-paper",
        className
      )}
    >
      {showImage ? (
        // User uploads come from arbitrary hosts, so next/image's allowlist does not fit here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ? `${name}` : ""}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden={name ? undefined : true}>{initials(name)}</span>
      )}
    </span>
  );
}

export function AvatarGroup({ people = [], max = 4, size = "sm" }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className={cx("flex items-center", size === "xs" ? "-space-x-1" : "-space-x-2")}>
      {shown.map((person, i) => (
        <Avatar key={person._id || person.id || i} src={person.profileImage || person.image} name={person.name} size={size} ring />
      ))}
      {rest > 0 ? (
        <span className={cx("relative inline-flex items-center justify-center rounded-full bg-mist font-semibold text-fg-2 ring-2 ring-paper", sizes[size])}>
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
