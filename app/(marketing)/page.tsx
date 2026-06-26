import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import type { ResourceCardData } from "@/components/resource/ResourceCard";
import type { CategoryTileData } from "@/components/resource/CategoryTiles";

import { LandingHero } from "@/components/landing/LandingHero";
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
  const authUser = await getAuthenticatedUser();

  if (authUser?.profile.role === "creator") {
    redirect("/creator/home");
  }

  const supabase = await createClient();

  const [{ data: categories }, { data: featuredResources }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .eq("level", 1)
      .order("sort_order")
      .returns<CategoryTileData[]>(),

    supabase
      .from("resources")
      .select("*, creators(name), categories(name, slug)")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      <LandingHero />
      <TrustStats />
      <CategoryBento categories={categories ?? []} />
      <FeaturedStrip resources={(featuredResources as ResourceCardData[] | null) ?? []} />
      <ValuePillars />
      <CreatorBand />
      <PricingTeaser />
    </>
  );
}
