"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "What does my subscription include?",
    a: "Your subscription gives you unlimited downloads of all published resources on the platform — templates, fonts, mockups, brand kits, icons, and motion assets. Downloads are available as long as your subscription is active.",
  },
  {
    q: "How do I download a resource?",
    a: "Browse to any resource and click the Download button on the detail page. You must have an active subscription. The file will download directly to your device.",
  },
  {
    q: "Can I use downloaded resources commercially?",
    a: "Yes. All resources come with a standard commercial license that covers personal and client work. For the full terms, see the License page linked in the footer.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major Nigerian debit and credit cards via Paystack. Card details are never stored on our servers.",
  },
  {
    q: "How do I cancel my subscription?",
    a: 'Go to Billing from your dashboard, then click "Cancel subscription". Your access continues until the end of the current billing period — no immediate loss of access.',
  },
  {
    q: "What happens to my downloads if I cancel?",
    a: "Any files you have already downloaded stay with you. You just won't be able to download new resources after your subscription ends.",
  },
  {
    q: "How do I become a creator on Creatly?",
    a: 'Click "For Creators" in the navigation or visit /creators and apply. Approved creators earn a share of the subscription pool based on how many times their work is downloaded.',
  },
  {
    q: "I'm having a technical issue — what should I do?",
    a: "Use the contact form below to describe the issue. Include your account email and what you were trying to do. We aim to respond within 1-2 business days.",
  },
] as const;

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border rounded-2xl border border-border">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
          >
            <span className="text-sm font-medium text-foreground">{item.q}</span>
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
