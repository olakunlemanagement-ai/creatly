"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "What can I download with a subscription?",
    a: "All published assets on Creatly — templates, fonts, mockups, motion graphics, brand kits, and more. New assets are added every week by curated African creators.",
  },
  {
    q: "Can I use downloads for client work?",
    a: "Yes. Every download includes a commercial license that covers client projects, social media, print, and digital use. Check the license page for the full terms.",
  },
  {
    q: "How does team billing work?",
    a: "A Team plan covers up to 5 seats. You pay one bill; all members get full download access under a shared workspace. You can invite and remove members from your team dashboard.",
  },
  {
    q: "What happens when I cancel?",
    a: "You keep full access until the end of your current billing period. We don't pro-rate or charge extra. After expiry, downloads are paused until you resubscribe.",
  },
];

export function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-2xl">
      <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-border rounded-2xl border border-border">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-expanded={open === i}
            >
              {faq.q}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-sm text-muted-foreground">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
