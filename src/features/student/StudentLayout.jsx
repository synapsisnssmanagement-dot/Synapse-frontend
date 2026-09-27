"use client";

import AppShell from "@/components/shell/AppShell";

export default function StudentLayout({ children }) {
  return <AppShell role="student">{children}</AppShell>;
}
