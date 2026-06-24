"use client";

interface PricingToggleProps {
  annual: boolean;
  onChange: (annual: boolean) => void;
}

export function PricingToggle({ annual, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(false)}
        className={`text-sm font-medium transition-colors ${
          !annual ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Monthly
      </button>

      <button
        role="switch"
        aria-checked={annual}
        onClick={() => onChange(!annual)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          annual ? "bg-brand-green-700" : "bg-muted"
        }`}
      >
        <span className="sr-only">Toggle annual billing</span>
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            annual ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
          annual ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        Annual
        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
          2 months free
        </span>
      </button>
    </div>
  );
}
