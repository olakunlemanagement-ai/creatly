import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamAcceptClient } from "./TeamAcceptClient";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Accept team invite — ${APP_NAME}`,
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function TeamAcceptPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Invalid invite link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link is missing or malformed. Ask the team owner to resend the invite.
        </p>
      </div>
    );
  }

  // Redirect guests to login, preserving the accept URL
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect(`/login?next=/teams/accept?token=${encodeURIComponent(token)}`);
  }

  // Validate the invite server-side (expiry, used)
  const supabase = await createClient();
  const { data: invite } = await supabase
    .from("team_invites")
    .select("id, accepted_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Invite not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link is invalid or has already been used.
        </p>
        <a href="/pricing" className="mt-6 text-sm text-accent underline">
          Browse plans →
        </a>
      </div>
    );
  }

  if (invite.accepted_at) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Invite already used</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link has already been accepted.
        </p>
        <a href="/dashboard" className="mt-6 text-sm text-accent underline">
          Go to dashboard →
        </a>
      </div>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Invite expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link expired on {new Date(invite.expires_at).toLocaleDateString()}. Ask the
          team owner to send a new invite.
        </p>
      </div>
    );
  }

  // Invite is valid — render the accept button (client component)
  return <TeamAcceptClient token={token} userEmail={auth.user.email} />;
}
