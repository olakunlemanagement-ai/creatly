"use client";

/** Derives a strength score (0–4) from a password string. */
function getStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  // Clamp to 0–4
  return Math.min(score, 4);
}

const LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
const COLOURS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-brand-green-500"] as const;
const TEXT_COLOURS = ["", "text-red-500", "text-orange-500", "text-yellow-600", "text-brand-green-600"] as const;

interface PasswordStrengthMeterProps {
  value: string;
}

export function PasswordStrengthMeter({ value }: PasswordStrengthMeterProps) {
  const score = getStrength(value);
  if (!value) return null;

  return (
    <div className="mt-1 space-y-1" aria-live="polite" aria-label={`Password strength: ${LABELS[score]}`}>
      {/* Four-segment bar */}
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((seg) => (
          <div
            key={seg}
            className={[
              "h-1 flex-1 rounded-full transition-colors duration-300",
              score >= seg ? COLOURS[seg] : "bg-border",
            ].join(" ")}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${TEXT_COLOURS[score]}`}>
          {LABELS[score]}
        </p>
      )}
    </div>
  );
}
