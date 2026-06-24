import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { Logo } from "@/components/brand/Logo";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "@/app/creators/apply/ApplyForm";

export const metadata: Metadata = {
  title: `Become a Creator — ${APP_NAME}`,
};

export default async function ApplyPage() {
  const auth = await getAuthenticatedUser();

  // Guest → login, return here after
  if (!auth) {
    redirect("/login?next=/creators/apply");
  }

  // Already a creator → send to studio
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profile) {
    redirect("/creator/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      {/* Slim header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <Link href="/creators">
          <Logo variant="full" tone="ink" size={28} />
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-5 py-12">
        <div className="w-full max-w-[480px]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {"// Creator application"}
          </p>
          <h1
            className="mt-2 font-heading text-3xl text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Set up your creator profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your handle and display name are public-facing. You can update everything
            except your handle later.
          </p>

          <div className="mt-8">
            <ApplyForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already a creator?{" "}
            <Link href="/creator" className="text-terracotta-500 hover:underline">
              Go to your studio →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
