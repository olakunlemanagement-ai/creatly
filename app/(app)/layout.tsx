import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  // Authenticated but not yet onboarded → redirect to the wizard.
  // getAuthenticatedUser() is already called here (zero extra queries).
  if (auth && !auth.profile.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1 pt-16 lg:pt-[6.5rem]">
        {children}
      </main>
    </div>
  );
}
