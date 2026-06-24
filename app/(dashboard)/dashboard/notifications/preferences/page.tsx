import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "./PreferencesForm";
import type { NotificationPreference } from "@/types/database";

export const metadata: Metadata = {
  title: `Notification Preferences — ${APP_NAME}`,
};

export default async function NotificationPreferencesPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/notifications/preferences");

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle() as { data: NotificationPreference | null };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <Link
        href="/dashboard/notifications"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to notifications
      </Link>

      <h1 className="mb-8 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
        Notification preferences
      </h1>

      <PreferencesForm prefs={prefs} />
    </div>
  );
}
