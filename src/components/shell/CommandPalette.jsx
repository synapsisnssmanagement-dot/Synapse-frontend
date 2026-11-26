"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { PROFILE_ICON } from "./nav";

// Ctrl/⌘ K quick-jump built on cmdk: fuzzy matching, grouped results,
// keyboard navigation and focus handling come from the library.
export default function CommandPalette({ open, onClose, config }) {
  const router = useRouter();

  const go = (href) => {
    onClose();
    router.push(href);
  };

  const groups = [...config.groups, { label: "Account", icon: PROFILE_ICON, items: [{ label: "My profile", href: config.profile, icon: PROFILE_ICON }] }];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(value) => (value ? null : onClose())}
      label="Search pages"
      overlayClassName="fixed inset-0 z-(--z-modal) bg-ink/40 backdrop-blur-[2px]"
      contentClassName="fixed left-1/2 top-[12vh] z-(--z-modal) w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-paper shadow-elevated outline-none"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <Command.Input
          autoFocus
          placeholder="Where do you want to go?"
          className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
        />
        <kbd className="rounded-md border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-muted">Esc</kbd>
      </div>
      <Command.List data-lenis-prevent className="scrollbar-quiet max-h-[min(60vh,440px)] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-10 text-center text-sm text-muted">No pages match that search.</Command.Empty>
        {groups.map((group) => (
          <Command.Group
            key={group.label}
            heading={group.label}
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
          >
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.href}
                  value={`${item.label} ${group.label}`}
                  onSelect={() => go(item.href)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-fg-2 data-[selected=true]:bg-mint data-[selected=true]:text-brand-700"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-subtle group-data-[selected=true]:text-brand-600" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <CornerDownLeft aria-hidden="true" className="size-3.5 opacity-0 group-data-[selected=true]:opacity-60" />
                </Command.Item>
              );
            })}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
