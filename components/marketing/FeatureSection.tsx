import { Download, CreditCard, Globe } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";

const features = [
  {
    icon: Download,
    title: "Unlimited downloads",
    description:
      "One flat subscription price. Download everything you need and keep it forever.",
  },
  {
    icon: CreditCard,
    title: "Pay in Naira",
    description:
      "Subscribe in NGN via Paystack. No foreign cards, no conversion fees, no friction.",
  },
  {
    icon: Globe,
    title: "Made for Africa",
    description:
      "Every asset is curated for African brands, aesthetics, and markets — not a global afterthought.",
  },
] as const;

export function FeatureSection() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
              What you get
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything a creative professional needs, in one place.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green-100 text-brand-green-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
