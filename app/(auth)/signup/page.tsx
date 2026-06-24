import { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: `Create account — ${APP_NAME}`,
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <SignupForm next={safeNext} />;
}
