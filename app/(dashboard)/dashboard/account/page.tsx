import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { AccountSettings } from "./AccountSettings";

export const metadata: Metadata = {
  title: `Account — ${APP_NAME}`,
};

export default async function AccountPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/account");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Account settings
        </h1>
      </div>

      <AccountSettings
        currentEmail={auth.user.email}
        fullName={auth.profile.full_name}
        avatarPath={auth.profile.avatar_path}
        gender={auth.profile.gender}
        dateOfBirth={auth.profile.date_of_birth}
        phoneNumber={auth.profile.phone_number}
      />
    </div>
  );
}
