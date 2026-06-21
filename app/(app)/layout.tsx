import { getAuthenticatedUser } from "@/lib/auth";
import { AppNavbar } from "@/components/shared/AppNavbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppNavbar auth={auth} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
