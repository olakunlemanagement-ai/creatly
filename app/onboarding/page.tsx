import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";
import { OnboardingWizard } from "@/app/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: `Welcome to ${APP_NAME}`,
};

export default async function OnboardingPage() {
  const auth = await getAuthenticatedUser();

  // Unauthenticated — middleware handles this but guard here too
  if (!auth) {
    redirect("/login?next=/onboarding");
  }

  // Already onboarded — transparent pass-through
  if (auth.profile.onboarded) {
    redirect("/browse");
  }

  // Fetch active categories for the interest chips in step 2
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order")
    .returns<Pick<Category, "id" | "name">[]>();

  return (
    <OnboardingWizard categories={categories ?? []} />
  );
}
