import { Reveal } from "@/components/shared/Reveal";

// Thin SVG line icons — hand-drawn aesthetic
function IconCuration() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="16" cy="16" r="12" />
      <path d="M16 10v6l4 2" />
      <path d="M8 8l16 16" strokeWidth="0.75" strokeDasharray="2 2" />
    </svg>
  );
}

function IconFairPay() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 20c0 0 4-2 10-2s10 2 10 2" />
      <path d="M16 6v20" />
      <path d="M11 10h10" />
      <path d="M11 14h10" />
    </svg>
  );
}

function IconConfidence() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4L6 9v8c0 5 4.5 9 10 11 5.5-2 10-6 10-11V9L16 4z" />
      <path d="M12 16l3 3 5-5" />
    </svg>
  );
}

const PILLARS = [
  {
    Icon: IconCuration,
    label: "Curated for quality",
    body: "Every asset reviewed for craft and commercial usefulness. No filler. No generic stock. Resources that actually fit African brands and aesthetics.",
    number: "01",
  },
  {
    Icon: IconFairPay,
    label: "Fair pay for creators",
    body: "Revenue flows proportionally to creators based on real download activity. The more your work is used, the more you earn.",
    number: "02",
  },
  {
    Icon: IconConfidence,
    label: "Download with confidence",
    body: "Commercial licence included on every asset. Use in client work, social media, or products — no attribution required.",
    number: "03",
  },
] as const;

export function ValuePillars() {
  return (
    <section className="bg-cream-100 px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {"// Why Creatly"}
          </p>
        </Reveal>

        <div className="mt-12 space-y-0 divide-y divide-border">
          {PILLARS.map(({ Icon, label, body, number }, i) => (
            <Reveal key={number} delay={i * 80}>
              <div className="grid grid-cols-1 gap-6 py-10 sm:grid-cols-[80px_1fr_2fr] sm:gap-10 sm:py-12">
                {/* Number */}
                <div className="flex items-start">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    {number}
                  </span>
                </div>

                {/* Icon + label */}
                <div className="flex items-start gap-4 sm:flex-col sm:gap-3">
                  <div className="text-terracotta-600">
                    <Icon />
                  </div>
                  <h3
                    className="font-heading text-xl text-foreground sm:text-2xl"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {label}
                  </h3>
                </div>

                {/* Body */}
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
