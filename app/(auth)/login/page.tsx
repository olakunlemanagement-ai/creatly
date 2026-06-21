import { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: `Sign in — ${APP_NAME}`,
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return <LoginForm searchParams={searchParams} />;
}
