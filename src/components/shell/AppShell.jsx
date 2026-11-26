"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { Menu, Search } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import useAuthGuard from "@/hooks/useAuthGuard";
import api from "@/lib/api";
import { logout } from "@/utils/auth";
import cx from "@/lib/cx";
import CommandPalette from "./CommandPalette";
import NotificationsMenu from "./NotificationsMenu";
import Sidebar from "./Sidebar";
import { ROLE_NAV, findCurrent, isActive } from "./nav";

const COLLAPSE_KEY = "synapsis.sidebar.collapsed.v2";

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
      <div className="hidden w-(--shell-sidebar) shrink-0 border-r border-line bg-paper lg:block" />
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
  return (
    <Drawer.Root open={open} onOpenChange={(value) => (value ? null : onClose())} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-(--z-drawer) bg-ink/40 backdrop-blur-[2px] lg:hidden" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-(--z-drawer) w-[min(86vw,300px)] shadow-elevated outline-none lg:hidden"
        >
          <Drawer.Title className="sr-only">Navigation</Drawer.Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function HubTabs({ group, pathname }) {
  if (!group?.items || group.items.length < 2) return null;
  return (
    <nav aria-label={`${group.label} sections`} className="min-w-0 flex-1">
      <ul className="scrollbar-quiet flex items-center gap-1 overflow-x-auto py-1">
        {group.items.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                  active ? "bg-ink text-white shadow-subtle" : "text-muted hover:bg-mist hover:text-fg"
                )}
              >
                <Icon aria-hidden="true" className={cx("size-4", active ? "text-brand" : "text-subtle")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line/70 bg-paper px-3 sm:gap-3 sm:px-6 lg:px-10">
          <IconButton label="Open navigation" icon={Menu} onClick={() => setNavOpen(true)} className="lg:hidden" />
          {current?.group?.items?.length > 1 ? (
            <HubTabs group={current.group} pathname={pathname} />
          ) : (
            <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg">{current?.item.label || "Overview"}</p>
          )}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-transparent bg-mist px-3.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg-2 md:flex"
          >
            <Search aria-hidden="true" className="size-4" />
            Search pages…
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
