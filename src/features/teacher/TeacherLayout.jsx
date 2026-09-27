"use client";

import AppShell from "@/components/shell/AppShell";

export default function TeacherLayout({ children }) {
  return <AppShell role="teacher">{children}</AppShell>;
}
