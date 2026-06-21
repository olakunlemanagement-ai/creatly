import { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  title: `Set new password — ${APP_NAME}`,
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
