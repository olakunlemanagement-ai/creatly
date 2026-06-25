import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { CreatorSignupForm } from "@/components/auth/CreatorSignupForm";

export const metadata: Metadata = {
  title: `Join as creator — ${APP_NAME}`,
};

export default function CreatorSignupPage() {
  return <CreatorSignupForm />;
}
