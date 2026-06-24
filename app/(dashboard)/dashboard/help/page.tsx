import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ExternalLink } from "lucide-react";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";
import { FAQAccordion } from "./FAQAccordion";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: `Help & Support — ${APP_NAME}`,
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center gap-3">
        <HelpCircle className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Help & Support
        </h1>
      </div>

      {/* Quick links */}
      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          View plans <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <Link
          href="/billing"
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Manage billing <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {CONTACT_EMAIL} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
      </div>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          Frequently asked questions
        </h2>
        <FAQAccordion />
      </section>

      {/* Contact form */}
      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold text-foreground">
          Contact support
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Didn&apos;t find an answer? Send us a message and we&apos;ll get back to you within 1–2
          business days. Or email us directly at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-green-700 underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <ContactForm />
      </section>
    </div>
  );
}
