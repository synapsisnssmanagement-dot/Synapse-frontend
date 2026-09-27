"use client";

import AppShell from "@/components/shell/AppShell";

export default function AdminLayout({ children }) {
  return <AppShell role="admin">{children}</AppShell>;
}
