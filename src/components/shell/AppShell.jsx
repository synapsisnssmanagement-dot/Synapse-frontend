"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Search } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { useDialogBehaviour, useIsClient } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import useAuthGuard from "@/hooks/useAuthGuard";
import api from "@/lib/api";
import { logout } from "@/utils/auth";
import cx from "@/lib/cx";
import CommandPalette from "./CommandPalette";
import NotificationsMenu from "./NotificationsMenu";
import Sidebar from "./Sidebar";
import { ROLE_NAV, findCurrent } from "./nav";

const COLLAPSE_KEY = "synapsis.sidebar.collapsed";

function readStored(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function ShellFrame() {
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas" aria-busy="true">
      <div className="hidden w-(--shell-sidebar) shrink-0 bg-ink lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-16 shrink-0 border-b border-line bg-paper" />
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10" role="status">
          <span className="sr-only">Loading your workspace</span>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-9 w-72 max-w-full" />
          <Skeleton className="mt-10 h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function MobileNav({ open, onClose, children }) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  useDialogBehaviour(open, panelRef, onClose);
  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-(--z-drawer) lg:hidden">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            className="relative h-full w-[min(86vw,300px)] shadow-elevated outline-none"
            initial={{ x: reduce ? 0 : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : "-100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function Workspace({ config, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => readStored(COLLAPSE_KEY) === "1");
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [user, setUser] = useState(() => ({ name: readStored("name") || "", email: readStored("email") || "", photo: null }));

  // Stored name is only a first-paint placeholder; the server has the real
  // name and photo (and profile pages fire this event after a save).
  useEffect(() => {
    const load = () =>
      api
        .get("/api/auth/me")
        .then((res) => {
          const me = res.data?.user;
          if (!me) return;
          setUser({ name: me.name || "", email: me.email || "", photo: me.photo || null });
          try {
            if (me.name) window.localStorage.setItem("name", me.name);
          } catch {
            // Cache only.
          }
        })
        .catch(() => {});
    load();
    window.addEventListener("synapsis:profile-updated", load);
    return () => window.removeEventListener("synapsis:profile-updated", load);
  }, []);
  const [isMac] = useState(() => /Mac|iPhone|iPad/.test(window.navigator.platform || window.navigator.userAgent));

  const current = findCurrent(config, pathname);
  const fullBleed = config.fullBleed?.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1");
      } catch {
        // Preference only; ignore storage failures.
      }
      return !value;
    });
  };

  const sidebarProps = { config, pathname, user, onLogout: () => logout() };

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <a
        href="#main"
        className="sr-only z-(--z-toast) rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside
        className="hidden shrink-0 transition-[width] duration-300 ease-out-expo lg:block"
        style={{ width: collapsed ? "var(--shell-sidebar-collapsed)" : "var(--shell-sidebar)" }}
      >
        <Sidebar {...sidebarProps} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-paper px-3 sm:gap-3 sm:px-6 lg:px-10">
          <IconButton label="Open navigation" icon={Menu} onClick={() => setNavOpen(true)} className="lg:hidden" />
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-2 text-[13px]">
              <li className="hidden shrink-0 text-muted sm:block">{config.label}</li>
              {current?.group && current.group.label !== "Overview" ? (
                <>
                  <li aria-hidden="true" className="hidden text-subtle sm:block">
                    /
                  </li>
                  <li className="hidden shrink-0 text-muted md:block">{current.group.label}</li>
                  <li aria-hidden="true" className="hidden text-subtle md:block">
                    /
                  </li>
                </>
              ) : (
                <li aria-hidden="true" className="hidden text-subtle sm:block">
                  /
                </li>
              )}
              <li aria-current="page" className="truncate font-semibold text-fg">
                {current?.item.label || "Overview"}
              </li>
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 w-60 items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg-2 md:flex"
          >
            <Search aria-hidden="true" className="size-4" />
            Jump to a page
            <kbd className="ml-auto rounded border border-line bg-paper px-1.5 py-0.5 text-[10.5px] font-semibold text-muted">
              {isMac ? "⌘ K" : "Ctrl K"}
            </kbd>
          </button>
          <IconButton label="Jump to a page" icon={Search} onClick={() => setPaletteOpen(true)} className="md:hidden" />
          {config.notifications ? <NotificationsMenu viewAllHref={config.announcements} /> : null}
          <Link href={config.profile} aria-label="Your profile" className="ml-1 rounded-full">
            <Avatar src={user.photo} name={user.name} size="sm" />
          </Link>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className={cx("scrollbar-quiet relative min-h-0 flex-1 overflow-y-auto outline-none", fullBleed && "bg-paper")}
        >
          {fullBleed ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">{children}</div>
          )}
        </main>
      </div>

      <MobileNav open={navOpen} onClose={() => setNavOpen(false)}>
        <Sidebar {...sidebarProps} mobile onNavigate={() => setNavOpen(false)} />
      </MobileNav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} config={config} />
    </div>
  );
}

export default function AppShell({ role, children }) {
  const config = ROLE_NAV[role];
  const { ready } = useAuthGuard(config.roles);
  if (!ready) return <ShellFrame />;
  return <Workspace config={config}>{children}</Workspace>;
}
