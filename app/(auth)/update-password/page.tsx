import { Metadata } from "next";
import dynamic from "next/dynamic";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Set new password — ${APP_NAME}`,
};

// SSR is disabled because this page is always reached via a redirect from the
// password-reset email flow, at which point a Supabase recovery session exists
// in cookies. Browser password managers are aggressive on a page with only
// password fields + an active session, injecting DOM attributes that the server
// render does not produce — causing a hydration mismatch. The form also
// requires a client-side recovery session to call auth.updateUser, so SSR
// provides no value here.
const UpdatePasswordForm = dynamic(
  () =>
    import("@/components/auth/UpdatePasswordForm").then(
      (m) => m.UpdatePasswordForm,
    ),
  { ssr: false },
);

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
