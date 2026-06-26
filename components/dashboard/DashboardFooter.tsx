import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function DashboardFooter() {
  return (
    <footer className="border-t border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {APP_NAME}
        </span>
        <nav className="flex gap-4" aria-label="Footer navigation">
          <Link href="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/dashboard/help" className="hover:text-foreground">
            Help
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
