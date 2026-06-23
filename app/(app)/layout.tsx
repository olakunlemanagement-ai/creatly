import { SiteHeader } from "@/components/nav/SiteHeader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Inner app pages: no hero underneath, so header is always solid */}
      <SiteHeader transparent={false} />
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
