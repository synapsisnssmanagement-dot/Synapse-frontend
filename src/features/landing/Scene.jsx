"use client";

import useChoreography from "@/lib/motion/useChoreography";

// Client boundary that animates server-rendered content via data-* attributes.
export default function Scene({ as: Tag = "section", deps = [], children, ...props }) {
  const ref = useChoreography(deps);
  return (
    <Tag ref={ref} {...props}>
      {children}
    </Tag>
  );
}
