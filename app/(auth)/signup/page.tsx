import { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: `Create account — ${APP_NAME}`,
};

export default function SignupPage() {
  return <SignupForm />;
}
