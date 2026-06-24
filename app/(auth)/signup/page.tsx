import { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: `Create account — ${APP_NAME}`,
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const { next, intent } = await searchParams;
  let safeNext: string | undefined;
  if (intent === "creator") {
    safeNext = "/creators/apply";
  } else if (next && next.startsWith("/") && !next.startsWith("//")) {
    safeNext = next;
  }
  return <SignupForm next={safeNext} />;
}
