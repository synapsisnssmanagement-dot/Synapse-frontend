"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { ROLE_NAV, findCurrent, isActive, isGroupActive } from "./nav";

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

const SPRING = { type: "spring", stiffness: 520, damping: 38, mass: 0.8 };

// Segmented control for the pages inside a section. The dark highlight glides
// between tabs; the row fades at its edges on small screens to signal scroll.
function HubTabs({ group, pathname, idPrefix = "hub" }) {
  const reduce = useReducedMotion();
  if (!group?.items || group.items.length < 2) return null;
  return (
    <nav aria-label={`${group.label} sections`} className="min-w-0 flex-1">
      <ul className="flex items-center gap-1 overflow-x-auto px-4 py-2.5 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-28px),transparent)] [scrollbar-width:none] lg:px-0 lg:py-1 lg:[mask-image:none] [&::-webkit-scrollbar]:hidden">
        {group.items.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="relative shrink-0">
              {active ? (
                <motion.span
                  layoutId={`${idPrefix}-pill`}
                  transition={reduce ? { duration: 0 } : SPRING}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-ink shadow-[0_6px_16px_-6px_rgb(10_15_26/0.45)]"
                />
              ) : null}
              <Link
                href={item.href}
                ref={active ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                  active ? "text-white" : "text-muted hover:bg-mist hover:text-fg"
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

// Floating dock for phones/tablets. Icons sit on a dark glass bar; the active
// section expands into a green pill with its label that springs between slots.
function BottomBar({ config, pathname, onMore }) {
  const reduce = useReducedMotion();
  const groups = config.groups;
  const overflow = groups.length > 5;
  const shown = overflow ? groups.slice(0, 4) : groups;
  const slots = shown.map((group) => ({
    key: group.label,
    label: group.short || group.label,
    icon: group.icon || group.items[0].icon,
    href: group.items[0].href,
    active: isGroupActive(group, pathname),
  }));
  if (overflow) {
    slots.push({ key: "more", label: "More", icon: Menu, onClick: onMore, active: groups.slice(4).some((g) => isGroupActive(g, pathname)) });
  }

  return (
    <div className="shrink-0 bg-gradient-to-t from-canvas via-canvas to-transparent px-3 pt-2 lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-[26px] bg-ink/95 p-1.5 shadow-[0_18px_40px_-12px_rgb(10_15_26/0.55),inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/5 backdrop-blur-xl"
      >
        {slots.map((slot) => {
          const Icon = slot.icon;
          const inner = (
            <>
              {slot.active ? (
                <motion.span
                  layoutId="dock-pill"
                  transition={reduce ? { duration: 0 } : SPRING}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[20px] bg-brand shadow-[0_6px_18px_-6px_rgb(22_182_122/0.7)]"
                />
              ) : null}
              <Icon aria-hidden="true" className={cx("relative size-[21px] shrink-0 transition-colors", slot.active ? "text-ink" : "text-white/55")} />
              <AnimatePresence initial={false}>
                {slot.active ? (
                  <motion.span
                    key="label"
                    className="relative overflow-hidden whitespace-nowrap text-[13px] font-bold text-ink"
                    initial={reduce ? false : { width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { width: 0, opacity: 0 }}
                    transition={reduce ? { duration: 0 } : SPRING}
                  >
                    {slot.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
              {!slot.active ? <span className="sr-only">{slot.label}</span> : null}
            </>
          );
          const cls = cx(
            "relative flex h-12 items-center justify-center gap-2 rounded-[20px] outline-none transition-[flex-grow] focus-visible:ring-2 focus-visible:ring-brand/60",
            slot.active ? "grow-[2.2] px-4" : "grow px-2 active:scale-95"
          );
          return slot.href ? (
            <Link key={slot.key} href={slot.href} aria-current={slot.active ? "page" : undefined} className={cls} style={{ flexBasis: 0 }}>
              {inner}
            </Link>
          ) : (
            <button key={slot.key} type="button" onClick={slot.onClick} className={cls} style={{ flexBasis: 0 }}>
              {inner}
            </button>
          );
        })}
      </nav>
    </div>
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line/70 bg-paper/90 px-4 backdrop-blur sm:gap-3 sm:px-6 lg:h-16 lg:px-10">
          {/* Mobile: big section title like a native app */}
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-700">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
              {config.label}
            </p>
            <p className="truncate text-[19px] font-bold leading-tight tracking-[-0.025em] text-fg">
              {current?.group?.items?.length > 1 ? current.group.label : current?.item.label || "Home"}
            </p>
          </div>
          {/* Desktop: section tabs inline */}
          <div className="hidden min-w-0 flex-1 lg:flex">
            {current?.group?.items?.length > 1 ? (
              <HubTabs group={current.group} pathname={pathname} />
            ) : (
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg">{current?.item.label || "Overview"}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-transparent bg-mist px-3.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg-2 lg:flex"
          >
            <Search aria-hidden="true" className="size-4" />
            Search pages…
            <kbd className="ml-auto rounded border border-line bg-paper px-1.5 py-0.5 text-[10.5px] font-semibold text-muted">
              {isMac ? "⌘ K" : "Ctrl K"}
            </kbd>
          </button>
          <IconButton label="Search pages" icon={Search} onClick={() => setPaletteOpen(true)} className="lg:hidden" />
          {config.notifications ? <NotificationsMenu viewAllHref={config.announcements} /> : null}
          <Link href={config.profile} aria-label="Your profile" className="ml-0.5 rounded-full">
            <Avatar src={user.photo} name={user.name} size="sm" />
          </Link>
        </header>

        {/* Mobile: swipeable sub-tabs for the current section */}
        {current?.group?.items?.length > 1 ? (
          <div className="shrink-0 border-b border-line/70 bg-paper lg:hidden">
            <HubTabs group={current.group} pathname={pathname} idPrefix="hub-m" />
          </div>
        ) : null}

        <main
          id="main"
          tabIndex={-1}
          className={cx("scrollbar-quiet relative min-h-0 flex-1 overflow-y-auto outline-none", fullBleed && "bg-paper")}
        >
          {fullBleed ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">{children}</div>
          )}
        </main>

        <BottomBar config={config} pathname={pathname} onMore={() => setNavOpen(true)} />
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
