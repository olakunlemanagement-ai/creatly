import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function CreatorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: form column ────────────────────────────────── */}
      <div className="flex flex-1 flex-col">

        {/* Mobile brand header */}
        <div className="flex items-center gap-3 border-b border-brand-green-800 bg-brand-green-900 px-5 py-4 lg:hidden">
          <Link href="/" aria-label="Home">
            <Logo variant="full" tone="cream" size={26} />
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center bg-cream-50 px-5 py-12">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>

      </div>

      {/* ── Right: brand panel (desktop only) ────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] flex-col bg-brand-green-900">
        {/* Logo */}
        <div className="p-10">
          <Link href="/" aria-label="Home">
            <Logo variant="mark" tone="cream" size={48} />
          </Link>
        </div>

        {/* Creator-specific panel content */}
        <div className="flex flex-1 flex-col items-start justify-center px-12">
          <p className="font-mono text-xs uppercase tracking-widest text-terracotta-400">
            {"// Creator Hub"}
          </p>
          <h2
            className="mt-5 max-w-[320px] font-heading text-3xl leading-snug text-cream-100"
            style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
          >
            Upload. Earn. Grow.
          </h2>
          <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-cream-200/70">
            Join thousands of African creatives earning from their templates, fonts, and mockups.
          </p>
          <div className="mt-8 h-px w-12 bg-terracotta-500 opacity-80" />

          <div className="mt-8 space-y-4">
            {[
              "Proportional revenue share from every download",
              "Paystack payouts in NGN — no FX hassle",
              "Your work, curated for African markets",
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-400" />
                <p className="text-sm text-cream-200/70">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="p-10 pb-12">
          <p className="text-xs text-cream-300/40">
            Already a member?{" "}
            <Link href="/login" className="text-cream-300/70 underline hover:text-cream-100">
              Sign in as buyer
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
