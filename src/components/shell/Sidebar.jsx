"use client";

import Link from "next/link";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Logo from "@/components/brand/Logo";
import Avatar from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import cx from "@/lib/cx";
import { isActive } from "./nav";

export default function Sidebar({ config, pathname, collapsed = false, onToggle, user, onLogout, onNavigate, mobile = false }) {
  const compact = collapsed && !mobile;

  return (
    <div className="flex h-full flex-col bg-ink text-on-dark">
      <div className={cx("flex h-16 shrink-0 items-center gap-2 border-b border-white/[0.06]", compact ? "justify-center px-2" : "justify-between px-4")}>
        <Link href={config.home} onClick={onNavigate} aria-label="Synapsis dashboard" className="rounded-md">
          <Logo tone="dark" size="sm" showWordmark={!compact} />
        </Link>
        {!mobile && !compact ? <IconButton variant="dark" size="sm" label="Collapse sidebar" icon={PanelLeftClose} onClick={onToggle} /> : null}
      </div>

      {!compact ? (
        <p className="eyebrow flex items-center gap-2 px-5 pt-5 text-[0.62rem] text-on-dark/40">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          {config.label} workspace
        </p>
      ) : null}

      <nav aria-label={`${config.label} navigation`} className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-4">
        {config.groups.map((group, groupIndex) => (
          <div key={group.label} className={groupIndex ? "mt-5" : undefined}>
            {compact ? (
              groupIndex ? <div aria-hidden="true" className="mx-3 mb-3 h-px bg-white/[0.07]" /> : null
            ) : (
              <p className="eyebrow mb-1.5 px-3 text-[0.6rem] text-on-dark/35">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={compact ? item.label : undefined}
                      title={compact ? item.label : undefined}
                      className={cx(
                        "group relative flex h-10 items-center gap-3 rounded-lg text-[13.5px] font-medium transition-colors duration-200",
                        compact ? "justify-center" : "px-3",
                        active ? "bg-white/[0.07] text-white" : "text-on-dark/60 hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      {active ? <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" /> : null}
                      <Icon
                        aria-hidden="true"
                        className={cx("size-[18px] shrink-0 transition-colors", active ? "text-brand" : "text-on-dark/40 group-hover:text-on-dark/80")}
                      />
                      {compact ? null : <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        {compact ? (
          <div className="flex flex-col items-center gap-1">
            <IconButton variant="dark" label="Expand sidebar" icon={PanelLeftOpen} onClick={onToggle} />
            <Link href={config.profile} aria-label="Your profile" title="Your profile" className="rounded-full p-1">
              <Avatar src={user.photo} name={user.name} size="sm" />
            </Link>
            <IconButton variant="dark" label="Sign out" icon={LogOut} onClick={onLogout} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href={config.profile}
              onClick={onNavigate}
              className={cx(
                "flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.04]",
                pathname.startsWith(config.profile) && "bg-white/[0.07]"
              )}
            >
              <Avatar src={user.photo} name={user.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-white">{user.name || "Your profile"}</span>
                <span className="block truncate text-[11.5px] text-on-dark/45">{user.email || config.label}</span>
              </span>
            </Link>
            <IconButton variant="dark" size="sm" label="Sign out" icon={LogOut} onClick={onLogout} />
          </div>
        )}
      </div>
    </div>
  );
}
