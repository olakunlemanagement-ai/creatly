import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, User } from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/studio", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/studio/assets", label: "My Assets", icon: Package, exact: false },
  { href: "/studio/profile", label: "Profile", icon: User, exact: false },
];

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthenticatedUser();

  // Unauthenticated → middleware handles, but guard here too
  if (!auth) redirect("/login?next=/studio");

  // Non-creators → prompt to apply
  if (auth.profile.role !== "creator") {
    redirect("/creators");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="border-b border-border bg-muted/30 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="px-4 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {"// Creator Studio"}
          </p>
        </div>
        <nav aria-label="Studio navigation">
          <ul className="flex flex-row gap-1 px-2 pb-4 md:flex-col">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main area */}
      <main className="flex-1 px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
