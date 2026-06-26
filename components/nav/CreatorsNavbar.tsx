import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function CreatorsNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-[#FAF4E9]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Logo variant="full" tone="ink" size={28} />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Creators page navigation">
          <Link
            href="#how-it-works"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            Pricing
          </Link>
          <Link
            href="/license"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            Privacy Policy
          </Link>
          <Link
            href="/creator/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/creator/signup"
            className="rounded-full bg-terracotta-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
