import Link from "next/link";
import { APP_NAME } from "@/lib/config";

const MESSAGES: Record<string, string> = {
  link_expired: "This link has expired or has already been used.",
  missing_token: "The confirmation link is invalid.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    MESSAGES[reason ?? ""] ?? "Something went wrong with this link.";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-semibold">{APP_NAME}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/signup"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Sign up again
          </Link>
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
