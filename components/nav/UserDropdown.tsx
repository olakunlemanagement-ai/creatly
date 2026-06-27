"use client";

import Link from "next/link";
import {
  LogOut,
  LayoutDashboard,
  Heart,
  CreditCard,
  Pencil,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import type { AuthenticatedUser } from "@/lib/auth";

interface UserDropdownProps {
  auth: AuthenticatedUser;
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

export function UserDropdown({ auth }: UserDropdownProps) {
  const displayName = auth.profile.full_name ?? auth.user.email;
  const avatarText = initials(auth.profile.full_name, auth.user.email);
  const role = auth.profile.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green-700 text-xs font-bold text-cream-100 ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Account menu for ${displayName}`}
      >
        {avatarText}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{auth.user.email}</p>
        </div>
        <DropdownMenuSeparator />

        {/* role='user' — consumer links only */}
        {role === "user" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/favourites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favourites
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* role='creator' — creator studio links, can browse marketplace */}
        {role === "creator" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/creator/home" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Creator Studio
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/browse" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Browse
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* role='admin' | 'super_admin' — admin panel only */}
        {(role === "admin" || role === "super_admin") && (
          <DropdownMenuItem asChild>
            <Link href="/backstage-cl-hq-manage-9x3kp2" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}

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
  );
}
