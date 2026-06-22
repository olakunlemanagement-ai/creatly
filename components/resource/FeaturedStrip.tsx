import { Reveal } from "@/components/shared/Reveal";
import { ResourceCard, type ResourceCardData } from "./ResourceCard";

interface FeaturedStripProps {
  resources: ResourceCardData[];
  favouriteIds?: Set<string>;
  userId?: string | null;
}

export function FeaturedStrip({
  resources,
  favouriteIds,
  userId = null,
}: FeaturedStripProps) {
  if (resources.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="border-t py-8">
      <Reveal>
        <h2
          id="featured-heading"
          className="mb-5 border-l-4 border-terracotta-500 pl-3 text-lg font-semibold tracking-tight"
        >
          Featured
        </h2>
      </Reveal>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {resources.map((resource, i) => (
          <Reveal
            key={resource.id}
            delay={Math.min(i, 3) * 80}
            className="w-64 flex-none snap-start sm:w-72"
          >
            <ResourceCard
              resource={resource}
              isFavourited={favouriteIds?.has(resource.id) ?? false}
              userId={userId}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
