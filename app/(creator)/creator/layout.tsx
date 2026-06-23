import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  if (!auth) redirect("/login?next=/creator");

  if (auth && !auth.profile.onboarded) redirect("/onboarding");

  if (auth.profile.role !== "creator") redirect("/creators");

  return <>{children}</>;
}
