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

  // Creators skip consumer onboarding entirely
  if (auth.profile.role === "creator") {
    redirect("/creator");
  }

  // Already onboarded — transparent pass-through
  if (auth.profile.onboarded) {
    redirect("/browse");
  }

  const supabase = await createClient();

  // Check for creator_profile in case role wasn't updated yet
  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (creatorProfile) {
    redirect("/creator");
  }

  // Fetch active categories for the interest chips in step 2
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .eq("level", 1)
    .order("sort_order")
    .returns<Pick<Category, "id" | "name">[]>();

  return (
    <OnboardingWizard categories={categories ?? []} />
  );
}
