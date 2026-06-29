"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package, User, BarChart2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import type { AuthenticatedUser } from "@/lib/auth";

interface CreatorHeaderClientProps {
  auth: AuthenticatedUser | null;
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const NAV_LINKS = [
  { href: "/creator", label: "Dashboard", exact: true },
  { href: "/creator/assets", label: "My Assets", exact: false },
  { href: "/creator/upload", label: "Upload", exact: false },
  { href: "/creator/earnings", label: "Earnings", exact: false },
  { href: "/creator/profile", label: "Profile", exact: false },
] as const;

export function CreatorHeaderClient({ auth }: CreatorHeaderClientProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Top bar — cream */}
      <div className="border-b border-stone-200 bg-[#FAF4E9]">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
          {/* Left: logo + label */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" aria-label="Home">
              <Logo variant="full" tone="ink" size={30} />
            </Link>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-stone-400 sm:block">
              Creator Hub
            </span>
          </div>

          {/* Center: spacer */}
          <div />

          {/* Right: auth */}
          <div className="flex items-center gap-3">
            {auth ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green-700 text-xs font-bold text-cream-100 ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Account menu for ${auth.profile.full_name ?? auth.user.email}`}
                >
                  {initials(auth.profile.full_name, auth.user.email)}
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-xs font-medium text-foreground">
                      {auth.profile.full_name ?? auth.user.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{auth.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/creator/assets" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Assets
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/creator/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem disabled className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    <span className="flex-1">Earnings</span>
                    <span className="text-[10px] text-muted-foreground">soon</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <form action={signOut} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/creators">Sign in</Link>
                </Button>
                <Button variant="terracotta" size="sm" className="rounded-full" asChild>
                  <Link href="/creators">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar — forest green */}
      <nav aria-label="Creator navigation" className="bg-[#14342B]">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-4 sm:px-6">
          {NAV_LINKS.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={[
                "shrink-0 whitespace-nowrap text-xs font-medium transition-colors duration-150",
                isActive(href, exact)
                  ? "text-terracotta-400"
                  : "text-white/80 hover:text-white",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
