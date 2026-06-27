import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { Logo } from "@/components/brand/Logo";
import { getAuthenticatedUser } from "@/lib/auth";
import { acceptAdminInvite } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: `Accept Admin Invite — ${APP_NAME}`,
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptAdminInvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <InviteErrorPage message="Invalid invite link. Please ask for a new one." />;
  }

  const auth = await getAuthenticatedUser();

  if (!auth) {
    const next = encodeURIComponent(`/accept-admin-invite?token=${token}`);
    redirect(`/login?next=${next}`);
  }

  const result = await acceptAdminInvite(token);

  if (result.error) {
    return <InviteErrorPage message={result.error} />;
  }

  redirect("/backstage-cl-hq-manage-9x3kp2");
}

function InviteErrorPage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-8 inline-block">
          <Logo variant="mark" className="mx-auto h-10 w-10" />
        </Link>
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldCheck className="h-7 w-7 text-destructive" />
          </div>
        </div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Invite error</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-brand-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-800 transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
