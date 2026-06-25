"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Download,
  Star,
  User,
  Settings,
  Bell,
  HelpCircle,
  Users,
  Menu,
  X,
  Crown,
  CreditCard,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { useSubscription } from "@/hooks/use-subscription";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/downloads", label: "Downloads", icon: Download },
  { href: "/dashboard/favourites", label: "Starred Items", icon: Star },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/account", label: "Account", icon: Settings },
  { href: "/billing", label: "Manage Subscription", icon: CreditCard },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/help", label: "Help", icon: HelpCircle },
];

const TEAM_NAV_ITEM: NavItem = {
  href: "/dashboard/team",
  label: "Team",
  icon: Users,
};

interface Props {
  userId: string;
  fullName: string | null;
  email: string;
  avatarPath: string | null;
  role: string;
  unreadCount: number;
  isTeamOwner: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  userId,
  fullName,
  email,
  avatarPath,
  role,
  unreadCount,
  isTeamOwner,
  children,
}: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sub = useSubscription(userId);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const navItems = isTeamOwner ? [...NAV_ITEMS, TEAM_NAV_ITEM] : NAV_ITEMS;

  const initials = (fullName ?? email)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <nav className="flex h-full flex-col py-6">
      {/* Logo */}
      <div className="mb-8 px-4">
        <Link href="/browse" aria-label="Home">
          <Logo variant="full" tone="ink" className="h-7 w-auto" />
        </Link>
      </div>

      {/* Nav links */}
      <ul className="flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const isNotifications = href === "/dashboard/notifications";
          return (
            <li key={href}>
              <Link
                href={href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-terracotta-500/10 text-terracotta-600"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 ${active ? "text-terracotta-500" : ""}`}
                />
                <span className="truncate">{label}</span>
                {isNotifications && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Upgrade nudge */}
      {!sub.loading && !sub.isActive && (
        <div className="px-3 pb-2">
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-xl border border-terracotta-500/30 bg-terracotta-500/8 px-3 py-2.5 text-xs font-semibold text-terracotta-600 transition-colors hover:bg-terracotta-500/15"
          >
            <Crown className="h-3.5 w-3.5 shrink-0" />
            <span>Free plan · Upgrade →</span>
          </Link>
        </div>
      )}

      {/* Creator Studio link */}
      {role === "creator" && (
        <div className="px-3 pb-2">
          <Link
            href="/creator"
            className="flex items-center gap-2 rounded-xl border border-brand-green-700/30 bg-brand-green-700/8 px-3 py-2.5 text-xs font-semibold text-brand-green-700 transition-colors hover:bg-brand-green-700/15"
          >
            Creator Studio →
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="mt-2 border-t border-border px-3 pt-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-green-700/20">
            {avatarPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPath}
                alt={fullName ?? email}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-brand-green-700">
                {initials}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {fullName ?? email}
            </p>
            {fullName && (
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
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
      <aside className="hidden w-60 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebar}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
        <Link href="/browse">
          <Logo variant="mark" tone="ink" className="h-7 w-7" />
        </Link>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Link
              href="/dashboard/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </Link>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl lg:hidden">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60 hover:bg-muted"
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
        {/* Mobile spacer for top bar */}
        <div className="h-14 lg:hidden" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
