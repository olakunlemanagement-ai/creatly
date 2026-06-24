import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";

export const metadata: Metadata = {
  title: `Favourites — ${APP_NAME}`,
};

export default async function FavouritesPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/favourites");

  const supabase = await createClient();

  const { data: favouriteRows } = await supabase
    .from("favourites")
    .select("resource_id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  const orderedIds = (favouriteRows ?? []).map((f) => f.resource_id);

  let resources: ResourceCardData[] = [];
  if (orderedIds.length > 0) {
    const { data } = await supabase
      .from("resources")
      .select("*, creators(name), categories(name, slug)")
      .eq("status", "published")
      .in("id", orderedIds);

    const byId = new Map((data ?? []).map((r) => [r.id, r]));
    resources = orderedIds
      .map((id) => byId.get(id))
      .filter((r): r is ResourceCardData => r !== undefined);
  }

  const favouritedIds = new Set(resources.map((r) => r.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="mb-8 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
        Favourites
      </h1>

      {resources.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Heart className="size-10 text-muted-foreground/40" strokeWidth={1} />
          <p className="text-base text-muted-foreground">Nothing saved yet.</p>
          <Link
            href="/browse"
            className="text-sm font-medium text-brand-green-700 underline underline-offset-2 hover:text-brand-green-800"
          >
            Browse resources
          </Link>
        </div>
      ) : (
        <ResourceGrid>
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isFavourited={favouritedIds.has(resource.id)}
              userId={auth.user.id}
            />
          ))}
        </ResourceGrid>
      )}
    </div>
  );
}
