import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { getAuthenticatedUser } from "@/lib/auth";
import { ExpiredBanner } from "@/components/shared/ExpiredBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  // Authenticated but not yet onboarded → redirect to the wizard.
  // Creators use a separate onboarding flow and skip the consumer wizard.
  if (auth && !auth.profile.onboarded && auth.profile.role !== "creator") {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* Subscription-expired banner — client component, hides when status becomes active via Realtime */}
      <ExpiredBanner userId={auth?.user.id} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
