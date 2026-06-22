import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {APP_NAME}
        </Link>

        <nav className="hidden sm:flex sm:items-center sm:gap-6">
          <Link
            href="/browse"
            className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            Browse
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-t border-border px-4 py-2 sm:hidden">
        <Link
          href="/browse"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse
        </Link>
        <Link
          href="/pricing"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Pricing
        </Link>
      </div>
    </header>
  );
}
