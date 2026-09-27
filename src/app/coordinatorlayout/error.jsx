"use client";

import { SegmentError } from "@/components/shell/RouteStates";

export default function Error(props) {
  return <SegmentError {...props} homeHref="/coordinatorlayout" />;
}
