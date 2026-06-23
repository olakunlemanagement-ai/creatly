import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";
import { getPreviewImageUrl } from "@/lib/storage";
import type { ResourceCardData } from "@/components/resource/ResourceCard";

interface FeaturedStripProps {
  resources: ResourceCardData[];
}

export function FeaturedStrip({ resources }: FeaturedStripProps) {
  if (resources.length === 0) return null;

  return (
    <section className="bg-background px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {"// Featured"}
              </p>
              <h2
                className="mt-3 font-heading text-4xl text-foreground sm:text-5xl"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
              >
                Hand-picked assets
              </h2>
            </div>
            <Link
              href="/browse"
              className="hidden text-sm font-medium text-terracotta-600 underline-offset-4 hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, i) => {
            const imgSrc = getPreviewImageUrl(resource.preview_image_path ?? "");
            const creator = Array.isArray(resource.creators)
              ? resource.creators[0]
              : resource.creators;
            const category = Array.isArray(resource.categories)
              ? resource.categories[0]
              : resource.categories;

            return (
              <Reveal key={resource.id} delay={i * 60}>
                <Link
                  href={`/resources/${resource.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {/* Preview */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {imgSrc && (
                      <Image
                        src={imgSrc}
                        alt={resource.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {category?.name ?? "Resource"}
                    </p>
                    <h3 className="mt-1 truncate text-sm font-semibold text-foreground">
                      {resource.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {creator?.name ?? "Creatly"}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={80}>
          <div className="mt-8 sm:hidden">
            <Link
              href="/browse"
              className="text-sm font-medium text-terracotta-600 underline-offset-4 hover:underline"
            >
              View all resources →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
