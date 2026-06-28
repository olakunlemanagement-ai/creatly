import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL, APP_DOMAIN } from "@/lib/config";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "./NewsletterForm";

const LINKS = [
  {
    heading: "Explore",
    items: [
      { label: "Browse resources", href: "/browse" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Sign up", href: "/signup" },
      { label: "Log in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "For Creators",
    items: [
      { label: "Become a creator", href: "/creators" },
      { label: "Creator portal", href: "/creators" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
      { label: APP_DOMAIN, href: `https://${APP_DOMAIN}` },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-brand-green-900">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">

        {/* Large wordmark + newsletter */}
        <div className="border-b border-white/10 py-14 sm:py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[360px]">
              <Logo variant="full" tone="cream" size={40} />
              <p className="mt-4 text-sm leading-relaxed text-cream-300/70">
                Creative resources for African creatives. One subscription, unlimited downloads.
              </p>
            </div>

            {/* Newsletter sign-up */}
            <div className="max-w-sm lg:min-w-[320px]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream-300/50">
                Stay in the loop
              </p>
              <p className="mt-2 text-sm text-cream-300/70">
                New asset drops, creator stories, and platform updates — in your inbox.
              </p>
              <NewsletterForm source="footer" />
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((col) => (
            <div key={col.heading}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-cream-300/50">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-cream-300/70 transition-colors hover:text-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 py-6">
          <p className="font-mono text-xs text-cream-300/40">
            © {year} {APP_NAME}. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
