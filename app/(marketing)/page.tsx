import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import type { ResourceCardData } from "@/components/resource/ResourceCard";
import type { Category } from "@/types/database";

import { LandingHero } from "@/components/landing/LandingHero";
import { CreatorHero } from "@/components/landing/CreatorHero";
import { TrustStats } from "@/components/landing/TrustStats";
import { CategoryBento } from "@/components/landing/CategoryBento";
import { FeaturedStrip } from "@/components/landing/FeaturedStrip";
import { ValuePillars } from "@/components/landing/ValuePillars";
import { CreatorBand } from "@/components/landing/CreatorBand";
import { PricingTeaser } from "@/components/landing/PricingTeaser";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_TAGLINE,
};

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: featuredResources }, authUser] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .eq("level", 1)
      .order("sort_order")
      .returns<Pick<Category, "id" | "name" | "slug">[]>(),

    supabase
      .from("resources")
      .select("*, creators(name), categories(name, slug)")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6),

    getAuthenticatedUser(),
  ]);

  const isCreator = authUser?.profile.role === "creator";

  return (
    <>
      {isCreator ? (
        <CreatorHero displayName={authUser.profile.full_name ?? authUser.user.email.split("@")[0]} />
      ) : (
        <LandingHero />
      )}
      <TrustStats />
      <CategoryBento categories={categories ?? []} />
      <FeaturedStrip resources={(featuredResources as ResourceCardData[] | null) ?? []} />
      <ValuePillars />
      <CreatorBand />
      <PricingTeaser />
    </>
  );
}
