import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME, APP_URL } from "@/lib/config";
import { getCreatorAssetUrl } from "@/lib/storage";
import { ResourceCard, type ResourceCardData } from "@/components/resource/ResourceCard";
import { ResourceGrid } from "@/components/resource/ResourceGrid";
import { SharePanel } from "@/components/shared/SharePanel";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import type { Json } from "@/types/database";

type Socials = {
  instagram?: string;
  twitter?: string;
  behance?: string;
  dribbble?: string;
  linkedin?: string;
  website?: string;
};

function parseSocials(raw: Json): Socials {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Socials;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_profiles")
    .select("display_name")
    .eq("handle", handle)
    .eq("status", "approved")
    .maybeSingle();

  if (!data) return { title: APP_NAME };
  return { title: `${data.display_name} — ${APP_NAME}` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CreatorStorefrontPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  // Fetch approved creator profile — unknown or non-approved handles → 404.
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("user_id, handle, display_name, bio, location, avatar_path, banner_path, socials")
    .eq("handle", handle)
    .eq("status", "approved")
    .maybeSingle();

  if (!profile) notFound();

  // Resolve the catalogue creator entity (needed to query resources by creator_id).
  const { data: creator } = await supabase
    .from("creators")
    .select("id, name")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  // Fetch published + approved resources for this creator.
  const { data: resourceRows } = creator
    ? await supabase
        .from("resources")
        .select(
          "*, creators(name), categories(name, slug)",
        )
        .eq("creator_id", creator.id)
        .eq("status", "published")
        .eq("review_status", "approved")
        .order("created_at", { ascending: false })
    : { data: [] };

  const resources = (resourceRows ?? []) as ResourceCardData[];
  const socials = parseSocials(profile.socials);

  const avatarUrl = getCreatorAssetUrl(profile.avatar_path);
  const bannerUrl = getCreatorAssetUrl(profile.banner_path);

  const socialLinks = [
    { key: "instagram", label: "Instagram", href: socials.instagram ? `https://instagram.com/${socials.instagram.replace(/^@/, "")}` : null },
    { key: "twitter",   label: "X / Twitter", href: socials.twitter ? `https://x.com/${socials.twitter.replace(/^@/, "")}` : null },
    { key: "behance",   label: "Behance",   href: socials.behance   ? `https://behance.net/${socials.behance}` : null },
    { key: "dribbble",  label: "Dribbble",  href: socials.dribbble  ? `https://dribbble.com/${socials.dribbble}` : null },
    { key: "linkedin",  label: "LinkedIn",  href: socials.linkedin  ? `https://linkedin.com/in/${socials.linkedin}` : null },
  ].filter((s): s is { key: string; label: string; href: string } => s.href !== null);

  return (
    <>
      <SiteHeader />

      <main id="main-content">
        {/* Banner */}
        <div className="relative h-40 w-full bg-brand-green-900 sm:h-56">
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        </div>

        {/* Profile header */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar */}
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-md sm:h-32 sm:w-32">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.display_name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-green-800 text-3xl font-bold text-brand-green-200">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + handle */}
            <div className="pb-1">
              <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {profile.display_name}
              </h1>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            </div>
          </div>

          {/* Bio + meta */}
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex-1">
              {profile.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              )}
              {profile.location && (
                <p className="mt-2 text-xs text-muted-foreground">
                  📍 {profile.location}
                </p>
              )}
            </div>

            {/* Social links + share */}
            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
              <SharePanel
                url={`${APP_URL}/creators/${handle}`}
                title={`${profile.display_name} on ${APP_NAME}`}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-border" />

          {/* Resources */}
          <section aria-labelledby="assets-heading">
            <h2
              id="assets-heading"
              className="mb-5 font-heading text-lg font-semibold text-foreground"
            >
              Assets
              {resources.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({resources.length})
                </span>
              )}
            </h2>

            {resources.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 px-6 py-16 text-center">
                <p className="text-sm text-muted-foreground">No published assets yet.</p>
              </div>
            ) : (
              <ResourceGrid>
                {resources.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </ResourceGrid>
            )}
          </section>

          <div className="mt-16 pb-16 text-center">
            <Link
              href="/browse"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to browse
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
