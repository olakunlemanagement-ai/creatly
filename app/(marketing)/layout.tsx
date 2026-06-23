import { SiteHeader } from "@/components/nav/SiteHeader";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader transparent={true} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
