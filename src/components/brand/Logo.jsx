import cx from "@/lib/cx";

const NODES = [
  [16, 5.5],
  [25.1, 10.75],
  [25.1, 21.25],
  [16, 26.5],
  [6.9, 21.25],
  [6.9, 10.75],
];

// One hub, six people: the synapse from the original Synapsis emblem, redrawn
// for the black / white / emerald system.
export function LogoMark({ className, title }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cx("shrink-0", className)}
    >
      {NODES.map(([x, y]) => {
        const dx = x - 16;
        const dy = y - 16;
        const len = Math.hypot(dx, dy);
        return (
          <line
            key={`l-${x}-${y}`}
            x1={16 + (dx / len) * 4.2}
            y1={16 + (dy / len) * 4.2}
            x2={x - (dx / len) * 2.6}
            y2={y - (dy / len) * 2.6}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="16" cy="16" r="3.1" stroke="currentColor" strokeWidth="2" />
      {NODES.map(([x, y]) => (
        <circle key={`n-${x}-${y}`} cx={x} cy={y} r="2.45" fill="#10B981" />
      ))}
    </svg>
  );
}

export default function Logo({ tone = "light", size = "md", showWordmark = true, className }) {
  const mark = { sm: "size-6", md: "size-8", lg: "size-10" }[size];
  const word = { sm: "text-[15px]", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <span className={cx("inline-flex items-center gap-2.5", tone === "dark" ? "text-white" : "text-ink", className)}>
      <LogoMark className={mark} />
      {showWordmark ? <span className={cx("font-extrabold uppercase leading-none tracking-[0.04em]", word)}>Synapsis</span> : null}
    </span>
  );
}
