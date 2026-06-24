import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { Button } from "@/components/ui/button";
import type { AuthenticatedUser } from "@/lib/auth";

interface AppNavbarProps {
  auth: AuthenticatedUser | null;
}

export function AppNavbar({ auth }: AppNavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {APP_NAME}
        </Link>

        {/* Primary nav */}
        <nav className="hidden sm:flex sm:items-center sm:gap-6">
          <Link
            href="/browse"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse
          </Link>
        </nav>

        {/* Auth controls */}
        <div className="flex items-center gap-2">
          {auth ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup/start">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile browse link */}
      <div className="flex border-t border-border px-4 py-2 sm:hidden">
        <Link
          href="/browse"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse
        </Link>
      </div>
    </header>
  );
}
