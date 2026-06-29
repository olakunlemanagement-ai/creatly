"use client";

import Link from "next/link";

import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

const studioLinks = [
  { label: "Home", href: "/creator/home" },
  { label: "Uploads", href: "/creator/assets" },
  { label: "Earnings", href: "/creator/earnings" },
  { label: "Settings", href: "/creator/profile" },
  { label: "Creator Terms", href: "/license" },
];

const platformLinks = [
  { label: "Browse Marketplace", href: "/browse" },
  { label: "Help & Support", href: "/dashboard/help" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Contact Us", href: `mailto:${CONTACT_EMAIL}` },
];

export function CreatorFooter() {
  return (
    <footer style={{ backgroundColor: "#14342B", color: "#FAF4E9" }}>
      <div className="mx-auto max-w-7xl px-8 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Left — brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight" style={{ color: "#FAF4E9" }}>
                {APP_NAME}
              </span>
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
                style={{ backgroundColor: "#1e5040", color: "#FAF4E9" }}
              >
                Creator Studio
              </span>
            </div>
            <p className="max-w-xs text-sm" style={{ color: "#c8bfaf" }}>
              The creative studio for African creators. Upload, earn, and grow.
            </p>
          </div>

          {/* Right — two nav columns */}
          <div className="flex gap-12">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#8fad9d" }}>
                Studio
              </p>
              <nav className="flex flex-col gap-2" aria-label="Creator studio links">
                {studioLinks.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: "#c8bfaf" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAF4E9")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#c8bfaf")}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#8fad9d" }}>
                Platform
              </p>
              <nav className="flex flex-col gap-2" aria-label="Platform links">
                {platformLinks.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: "#c8bfaf" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAF4E9")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#c8bfaf")}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ borderTop: "1px solid #1e5040" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <p className="text-xs" style={{ color: "#8fad9d" }}>
            © {new Date().getFullYear()} {APP_NAME} — Creator Studio
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: "X (Twitter)", href: "https://twitter.com/joincreatly" },
              { label: "Instagram", href: "https://instagram.com/joincreatly" },
              { label: "LinkedIn", href: "https://linkedin.com/company/joincreatly" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors"
                style={{ color: "#8fad9d" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FAF4E9")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8fad9d")}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
