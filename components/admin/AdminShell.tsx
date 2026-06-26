"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Tag,
  FileBox,
  ClipboardList,
  BarChart3,
  Wallet,
  Menu,
  X,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { APP_NAME } from "@/lib/config";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/creators", label: "Creators", icon: UserCheck },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/resources", label: "Resources", icon: FileBox },
  { href: "/admin/review", label: "Review Queue", icon: ClipboardList },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/earnings", label: "Earnings", icon: Wallet },
];

// Dark forest brand colour for the admin sidebar
const SIDEBAR_BG = "#14342B";

interface Props {
  fullName: string | null;
  email: string;
  role: string;
  children: React.ReactNode;
}

export function AdminShell({ fullName, email, role, children }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const initials = (fullName ?? email)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <nav
      className="flex h-full flex-col py-6"
      style={{ background: SIDEBAR_BG }}
    >
      {/* Logo + Admin badge */}
      <div className="mb-8 flex items-center gap-2.5 px-4">
        <Link href="/admin/overview" aria-label={`${APP_NAME} Admin`}>
          <Logo variant="mark" tone="cream" className="h-7 w-7" />
        </Link>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-white/70">
          Admin
        </span>
      </div>

      {/* Nav links */}
      <ul className="flex flex-1 flex-col gap-0.5 px-2">
        {[
          ...NAV_ITEMS,
          ...(role === "super_admin"
            ? [{ href: "/admin/team", label: "Team", icon: UserCog }]
            : []),
        ].map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-terracotta-500/20 text-terracotta-300"
                    : "text-white/60 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${active ? "text-terracotta-400" : ""}`}
                />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Admin identity footer */}
      <div className="mt-2 border-t border-white/10 px-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta-500/20">
            <ShieldCheck className="h-4 w-4 text-terracotta-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white/90">
              {fullName ?? email}
            </p>
            {fullName && (
              <p className="truncate text-[11px] text-white/40">{email}</p>
            )}
          </div>
          <LogoutButton iconOnly />
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block" style={{ background: SIDEBAR_BG }}>
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebar}</div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 px-4 lg:hidden"
        style={{ background: SIDEBAR_BG }}
      >
        <Link href="/admin/overview">
          <Logo variant="mark" tone="cream" className="h-7 w-7" />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl lg:hidden"
            style={{ background: SIDEBAR_BG }}
          >
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebar}
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 lg:hidden" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
