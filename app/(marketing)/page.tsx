import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { ResourceCardData } from "@/components/resource/ResourceCard";
import { LandingHero } from "@/components/marketing/LandingHero";
import { ValueStrip } from "@/components/marketing/ValueStrip";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { CategoryShowcase } from "@/components/marketing/CategoryShowcase";
import { FeaturedResources } from "@/components/marketing/FeaturedResources";
import { PricingTeaser } from "@/components/marketing/PricingTeaser";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_TAGLINE,
};

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: featuredResources }] = await Promise.all(
    [
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("resources")
        .select("*, creators(name), categories(name, slug)")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6),
    ],
  );

  return (
    <>
      <LandingHero />
      <ValueStrip />
      <FeatureSection />
      <CategoryShowcase categories={categories ?? []} />
      <FeaturedResources
        resources={(featuredResources as ResourceCardData[] | null) ?? []}
      />
      <PricingTeaser />
    </>
  );
}
