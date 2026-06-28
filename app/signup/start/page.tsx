import type { Metadata } from "next";
import Link from "next/link";
import { Download, Palette } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Join ${APP_NAME}`,
};

const INTENTS = [
  {
    href: "/signup",
    icon: Download,
    title: "I want to download assets",
    description: "Access unlimited templates, fonts, mockups, and motion assets with one subscription.",
    cta: "Start as a subscriber",
  },
  {
    href: "/creators",
    icon: Palette,
    title: "I want to sell my work",
    description: "Upload your creative work and earn from every subscriber download.",
    cta: "Apply as a creator",
  },
] as const;

export default function SignupStartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      {/* Header */}
      <header className="flex items-center border-b border-brand-green-800 bg-brand-green-900 px-5 py-4">
        <Link href="/" aria-label="Home">
          <Logo variant="full" tone="cream" size={26} />
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-2xl">
          <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            What brings you to {APP_NAME}?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Choose the path that fits you best. You can always do both later.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INTENTS.map(({ href, icon: Icon, title, description, cta }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-2xl border border-border bg-white p-7 transition-all duration-150 hover:border-brand-green-600 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green-900 text-cream-100">
                  <Icon className="size-5" />
                </span>

                <span className="mt-5 text-lg font-semibold leading-snug text-foreground">
                  {title}
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </span>

                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green-700 group-hover:text-brand-green-900">
                  {cta}
                  <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-green-700 hover:text-brand-green-900 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
