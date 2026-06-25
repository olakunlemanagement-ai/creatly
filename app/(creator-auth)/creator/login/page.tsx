import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { CreatorLoginForm } from "@/components/auth/CreatorLoginForm";

export const metadata: Metadata = {
  title: `Creator sign in — ${APP_NAME}`,
};

export default function CreatorLoginPage() {
  return <CreatorLoginForm />;
}
