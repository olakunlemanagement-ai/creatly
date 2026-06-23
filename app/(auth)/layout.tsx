import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">

      {/* ── Left: form column ────────────────────────────────── */}
      <div className="flex flex-1 flex-col">

        {/* Mobile brand header (visible below lg) */}
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
      <div className="hidden lg:block lg:w-[45%] xl:w-[48%]">
        <AuthBrandPanel />
      </div>

    </div>
  );
}
