import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-brand-green-900 text-cream-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <span
              className="text-lg font-semibold text-cream-100"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {APP_NAME}
            </span>
            <p className="mt-2 text-sm text-cream-300">
              Creative resources for African creatives.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cream-300">
              Explore
            </p>
            <ul className="space-y-2">
              {[
                { label: "Browse resources", href: "/browse" },
                { label: "Pricing", href: "/pricing" },
                { label: "Sign up", href: "/signup" },
                { label: "Log in", href: "/login" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-cream-300 transition-colors duration-150 hover:text-cream-100 motion-reduce:transition-none"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cream-300">
              Support
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm text-cream-300 transition-colors duration-150 hover:text-cream-100 motion-reduce:transition-none"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-cream-300">
          &copy; {year} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
