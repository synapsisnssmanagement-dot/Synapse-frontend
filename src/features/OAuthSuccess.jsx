"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/brand/Logo";
import Spinner from "@/components/ui/Spinner";

const DESTINATIONS = {
  admin: "/adminpanel",
  superadmin: "/adminpanel",
  coordinator: "/coordinatorlayout",
  teacher: "/teacherLayout",
  student: "/studentlayout/dashboard",
  volunteer: "/studentlayout/dashboard",
  alumni: "/alumnilayout/dashboard",
};

export default function OAuthSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");

    // Full reloads, not router.push: SocketProvider reads the token once on
    // mount, so it must re-mount to pick up the session stored here.
    if (token && role && DESTINATIONS[role]) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      window.location.replace(DESTINATIONS[role]);
    } else {
      window.location.replace(token ? "/login?error=invalidrole" : "/login");
    }
  }, []);

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center text-white">
      <LogoMark className="size-12 text-white" />
      <div role="status" className="mt-8 flex items-center gap-3 text-[15px] font-medium text-on-dark/80">
        <Spinner className="size-4 text-brand" />
        Signing you in with Google
      </div>
      <p className="mt-3 max-w-xs text-[13.5px] text-on-dark/50">Opening your workspace in a moment.</p>
    </main>
  );
}
