"use client";

import AppShell from "@/components/shell/AppShell";

export default function CoordinatorLayout({ children }) {
  return <AppShell role="coordinator">{children}</AppShell>;
}
