"use client";

import Link from "next/link";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Logo from "@/components/brand/Logo";
import Avatar from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import cx from "@/lib/cx";
import { isGroupActive } from "./nav";

export default function Sidebar({ config, pathname, collapsed = false, onToggle, user, onLogout, onNavigate, mobile = false }) {
  const compact = collapsed && !mobile;

  return (
    <div className="flex h-full flex-col border-r border-line/70 bg-paper text-fg">
      <div className={cx("flex h-16 shrink-0 items-center gap-2", compact ? "justify-center px-2" : "justify-between pl-5 pr-3")}>
        <Link href={config.home} onClick={onNavigate} aria-label="Synapsis dashboard" className="rounded-md">
          <Logo tone="light" size="sm" showWordmark={!compact} />
        </Link>
        {!mobile && !compact ? <IconButton variant="soft" size="sm" label="Collapse sidebar" icon={PanelLeftClose} onClick={onToggle} /> : null}
      </div>

      {!compact ? (
        <div className="px-4 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[12px] font-semibold text-brand-700">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
            {config.label}
          </span>
        </div>
      ) : null}

      <nav aria-label={`${config.label} navigation`} className="scrollbar-quiet min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-4">
        <ul className="space-y-1">
          {config.groups.map((group) => {
            const active = isGroupActive(group, pathname);
            const Icon = group.icon || group.items[0].icon;
            return (
              <li key={group.label}>
                <Link
                  href={group.items[0].href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? group.label : undefined}
                  title={compact ? group.label : undefined}
                  className={cx(
                    "group flex h-11 items-center gap-3 rounded-xl text-[14.5px] font-medium transition-colors duration-150",
                    compact ? "justify-center" : "px-3",
                    active ? "bg-mint font-semibold text-brand-700" : "text-fg-2 hover:bg-mist hover:text-fg"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cx("size-5 shrink-0 transition-colors", active ? "text-brand-600" : "text-subtle group-hover:text-fg-2")}
                  />
                  {compact ? null : <span className="truncate">{group.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line/70 p-3">
        {compact ? (
          <div className="flex flex-col items-center gap-1">
            <IconButton variant="soft" label="Expand sidebar" icon={PanelLeftOpen} onClick={onToggle} />
            <Link href={config.profile} aria-label="Your profile" title="Your profile" className="rounded-full p-1">
              <Avatar src={user.photo} name={user.name} size="sm" />
            </Link>
            <IconButton variant="soft" label="Sign out" icon={LogOut} onClick={onLogout} />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link
              href={config.profile}
              onClick={onNavigate}
              className={cx(
                "flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-mist",
                pathname.startsWith(config.profile) && "bg-mist"
              )}
            >
              <Avatar src={user.photo} name={user.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-fg">{user.name || "Your profile"}</span>
                <span className="block truncate text-[12px] text-muted">{user.email || config.label}</span>
              </span>
            </Link>
            <IconButton variant="soft" size="sm" label="Sign out" icon={LogOut} onClick={onLogout} />
          </div>
        )}
      </div>
    </div>
  );
}
