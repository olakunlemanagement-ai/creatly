import type { Metadata } from "next";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: `License — ${APP_NAME}`,
  description: `Content license terms for ${APP_NAME} assets`,
};

export default function LicensePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 lg:pt-32">
      <h1
        className="font-heading text-4xl font-bold tracking-tight text-stone-900 lg:text-5xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Content License
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        Full license terms are coming soon. All assets on {APP_NAME} are
        provided under a standard royalty-free subscription license for personal
        and commercial use.
      </p>

      <dl className="mt-12 space-y-8 border-t border-stone-200 pt-8">
        <div>
          <dt className="font-semibold text-stone-900">What&apos;s included</dt>
          <dd className="mt-2 text-stone-600">
            Use assets in personal and commercial projects — websites, social
            media, print, video, and more — for as long as you hold an active
            subscription.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">What&apos;s not allowed</dt>
          <dd className="mt-2 text-stone-600">
            Reselling, redistributing, or sublicensing the raw asset files is
            not permitted. You may not claim ownership of the original designs.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">Questions?</dt>
          <dd className="mt-2 text-stone-600">
            Email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-terracotta-600 underline underline-offset-2 hover:text-terracotta-700"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            and we&apos;ll be happy to help.
          </dd>
        </div>
      </dl>
    </div>
  );
}
