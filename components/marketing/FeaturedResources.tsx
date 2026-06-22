import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";

interface FeaturedResourcesProps {
  resources: ResourceCardData[];
}

export function FeaturedResources({ resources }: FeaturedResourcesProps) {
  if (resources.length === 0) return null;

  return (
    <section className="bg-background px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
                Featured resources
              </h2>
              <p className="mt-2 text-muted-foreground">
                Hand-picked creative assets for your next project.
              </p>
            </div>
            <Link
              href="/browse"
              className="hidden text-sm font-medium text-primary transition-colors duration-150 hover:text-brand-green-700 motion-reduce:transition-none sm:block"
              aria-label="Browse all resources"
            >
              View all →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, i) => (
            <Reveal key={resource.id} delay={i * 60}>
              <ResourceCard resource={resource} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={60}>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/browse"
              className="text-sm font-medium text-primary transition-colors duration-150 hover:text-brand-green-700 motion-reduce:transition-none"
            >
              View all resources →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
