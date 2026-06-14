"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app/profile", label: "Profile" },
  { href: "/app/universities", label: "Universities" },
  { href: "/app/results", label: "Results" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-small font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
              active ? "bg-ink-50 text-ink-700" : "text-stone-600 hover:bg-ink-50 hover:text-ink-700",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
