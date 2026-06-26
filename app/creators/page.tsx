import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { CreatorsNavbar } from "@/components/nav/CreatorsNavbar";

export const metadata: Metadata = {
  title: `For Creators — ${APP_NAME}`,
  description: `Sell your templates, fonts, mockups, and motion assets on ${APP_NAME}. Earn from every download.`,
};

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Apply in minutes",
    body: "Create your creator profile, pick a handle, and you're live — no waitlist, no lengthy review.",
  },
  {
    n: "02",
    title: "Upload your work",
    body: "Add titles, tags, and previews. Your assets are automatically indexed in the catalogue.",
  },
  {
    n: "03",
    title: "Earn every download",
    body: "Your share of the subscription pool grows with every download — proportional, transparent, monthly.",
  },
];

const FAQS = [
  {
    q: "What can I sell?",
    a: "Templates, fonts, mockups, motion assets, UI kits — anything a creative professional would use in their work.",
  },
  {
    q: "How is my earnings calculated?",
    a: "Your monthly payout = (your downloads ÷ total platform downloads) × creator pool. The pool is a fixed percentage of subscription revenue.",
  },
  {
    q: "Is there a review process?",
    a: "Assets publish immediately on submission. Our moderation team reviews for quality and may remove content that doesn't meet guidelines.",
  },
  {
    q: "Do I keep the rights to my work?",
    a: "Yes. You retain full ownership. You grant subscribers a non-exclusive licence to use your assets within their projects.",
  },
];

export default function CreatorsLandingPage() {
  return (
    <>
      <CreatorsNavbar />
      <main id="main-content">
        {/* Hero */}
        <section className="bg-brand-green-900 px-5 pb-24 pt-32">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand-green-400">
              {"// For creators"}
            </p>
            <h1
              className="mt-4 font-heading text-5xl leading-[1.1] text-cream-50 md:text-6xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your work.<br />
              <span className="text-terracotta-400">Your income.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-green-200">
              Upload your templates, fonts, mockups, and motion assets.
              Subscribers download your work — you earn every time.
              No upfront fees. No approval delays.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/creators/apply"
                className="rounded-xl bg-terracotta-500 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-600"
              >
                Become a creator →
              </Link>
              <Link
                href="/browse"
                className="rounded-xl border border-brand-green-600 px-8 py-3 text-sm font-semibold text-cream-50 transition-colors hover:border-brand-green-400"
              >
                Browse the catalogue
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-cream-50 px-5 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {"// How it works"}
            </p>
            <h2
              className="mt-3 font-heading text-3xl text-foreground md:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Simple. Transparent. Yours.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map(({ n, title, body }) => (
                <div key={n} className="space-y-3">
                  <span className="font-mono text-xs text-terracotta-500">{n}</span>
                  <div className="h-px w-8 bg-terracotta-500" />
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-background px-5 py-20">
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {"// FAQ"}
            </p>
            <h2
              className="mt-3 font-heading text-3xl text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Questions answered
            </h2>
            <dl className="mt-10 space-y-8">
              {FAQS.map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-semibold text-foreground">{q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-terracotta-500 px-5 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta-100">
            {"// Ready?"}
          </p>
          <h2
            className="mt-3 font-heading text-3xl text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Start earning from your craft
          </h2>
          <p className="mt-3 text-sm text-terracotta-100">
            Join {APP_NAME} and reach creative professionals across Africa.
          </p>
          <Link
            href="/creators/apply"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-terracotta-600 transition-colors hover:bg-cream-50"
          >
            Create your profile →
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
