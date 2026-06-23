import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile } from "@/types/database";
import { ProfileEditor } from "@/app/(app)/studio/profile/ProfileEditor";

export const metadata: Metadata = { title: `Edit Profile — ${APP_NAME}` };

export default async function StudioProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle<CreatorProfile>();

  if (!profile) {
    redirect("/creators/apply");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"// Profile"}
        </p>
        <h1
          className="mt-1 font-heading text-3xl text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Edit profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your public creator profile on{" "}
          <span className="font-medium text-foreground">{APP_NAME}</span>.
        </p>
      </div>

      <div className="max-w-md">
        <ProfileEditor profile={profile} />
      </div>
    </div>
  );
}
