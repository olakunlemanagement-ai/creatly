import { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { RequestResetForm } from "@/components/auth/RequestResetForm";

export const metadata: Metadata = {
  title: `Reset password — ${APP_NAME}`,
};

export default function ResetPasswordPage() {
  return <RequestResetForm />;
}
