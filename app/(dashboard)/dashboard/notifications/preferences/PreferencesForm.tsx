"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { saveNotificationPreferences } from "@/lib/actions/notifications";
import type { NotificationPreference } from "@/types/database";

const FREQ_OPTIONS = [
  { value: "instant", label: "Immediately" },
  { value: "daily",   label: "Daily digest" },
  { value: "weekly",  label: "Weekly digest" },
  { value: "never",   label: "Never" },
] as const;

interface ToggleRowProps {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

function ToggleRow({ id, name, label, description, defaultChecked }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-foreground">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <label
          htmlFor={id}
          className="flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-transparent bg-muted transition-colors peer-checked:bg-brand-green-700 peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
        >
          <span className="ml-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
    </div>
  );
}

interface Props {
  prefs: NotificationPreference | null;
}

type SaveState = { ok: true } | { ok: false; error: string } | null;

export function PreferencesForm({ prefs }: Props) {
  const [state, action, pending] = useActionState(
    saveNotificationPreferences,
    null as SaveState,
  );

  return (
    <form action={action} className="space-y-8">
      {/* Email preferences */}
      <section>
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Email notifications
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose which emails you want to receive.
        </p>

        <div className="divide-y divide-border rounded-2xl border border-border px-4">
          <ToggleRow
            id="email_new_resources"
            name="email_new_resources"
            label="New resources"
            description="Get notified when new resources are added to the library."
            defaultChecked={prefs?.email_new_resources ?? true}
          />
          <ToggleRow
            id="email_renewal_reminders"
            name="email_renewal_reminders"
            label="Renewal reminders"
            description="Receive a reminder before your subscription renews."
            defaultChecked={prefs?.email_renewal_reminders ?? true}
          />
          <ToggleRow
            id="email_subscription_events"
            name="email_subscription_events"
            label="Subscription updates"
            description="Confirmations, cancellations, and other subscription changes."
            defaultChecked={prefs?.email_subscription_events ?? true}
          />
          <ToggleRow
            id="email_payment_failed"
            name="email_payment_failed"
            label="Payment failures"
            description="Get notified if a payment attempt fails."
            defaultChecked={prefs?.email_payment_failed ?? true}
          />
          <ToggleRow
            id="email_team_events"
            name="email_team_events"
            label="Team activity"
            description="Invites, member joins, and team changes."
            defaultChecked={prefs?.email_team_events ?? true}
          />
        </div>
      </section>

      {/* New resources frequency */}
      <section>
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          New resources frequency
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          How often would you like to hear about new resources?
        </p>
        <div className="flex flex-wrap gap-3">
          {FREQ_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors has-[:checked]:border-brand-green-700 has-[:checked]:bg-brand-green-700/8 has-[:checked]:text-brand-green-700"
            >
              <input
                type="radio"
                name="email_new_resources_freq"
                value={value}
                defaultChecked={(prefs?.email_new_resources_freq ?? "weekly") === value}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {state?.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.ok === true && (
        <p className="text-sm text-brand-green-600">Preferences saved!</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-brand-green-700 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:bg-brand-green-800 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save preferences
      </button>
    </form>
  );
}
