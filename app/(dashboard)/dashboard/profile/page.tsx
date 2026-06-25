import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { User } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: `Profile — ${APP_NAME}`,
};

export default async function ProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) redirect("/login?next=/dashboard/profile");

  const memberSince = new Date(auth.profile.created_at).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center gap-3">
        <User className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Profile
        </h1>
      </div>

      <ProfileForm
        fullName={auth.profile.full_name}
        email={auth.user.email}
        avatarPath={auth.profile.avatar_path}
        memberSince={memberSince}
        gender={auth.profile.gender}
        dateOfBirth={auth.profile.date_of_birth}
        phoneNumber={auth.profile.phone_number}
      />
    </div>
  );
}
