"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; ready?: boolean };

export function PanelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1">
      {items.map((item, i) => {
        if (item.ready === false) {
          return (
            <span
              key={item.href}
              className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-full px-4 py-2 text-sm text-muted/60"
            >
              {item.label}
              <span className="rounded-full border border-line px-1.5 text-[10px] uppercase">
                pronto
              </span>
            </span>
          );
        }
        const active =
          i === 0 ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}