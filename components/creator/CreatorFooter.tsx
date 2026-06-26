import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function CreatorFooter() {
  return (
    <footer className="border-t border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {APP_NAME} — Creator Studio
        </span>
        <nav className="flex gap-4" aria-label="Creator footer navigation">
          <Link href="/creator/home" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/creator/uploads" className="hover:text-foreground">
            Uploads
          </Link>
          <Link href="/creator/earnings" className="hover:text-foreground">
            Earnings
          </Link>
          <Link href="/creator/settings" className="hover:text-foreground">
            Settings
          </Link>
          <Link href="/legal/creator-terms" className="hover:text-foreground">
            Creator Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
