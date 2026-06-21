import { ResourceCard, type ResourceCardData } from "./ResourceCard";

interface FeaturedStripProps {
  resources: ResourceCardData[];
}

export function FeaturedStrip({ resources }: FeaturedStripProps) {
  if (resources.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="border-t py-8">
      <h2
        id="featured-heading"
        className="mb-5 border-l-4 border-terracotta-500 pl-3 text-lg font-semibold tracking-tight"
      >
        Featured
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="w-64 flex-none sm:w-72"
            style={{ scrollSnapAlign: "start" }}
          >
            <ResourceCard resource={resource} />
          </div>
        ))}
      </div>
    </section>
  );
}
