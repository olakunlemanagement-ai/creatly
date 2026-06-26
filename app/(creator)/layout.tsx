import { CreatorHeader } from "@/components/nav/CreatorHeader";
import { CreatorFooter } from "@/components/creator/CreatorFooter";

export default function CreatorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <CreatorHeader />
      <main id="main-content" className="flex-1 pt-16 lg:pt-[6.5rem]">
        {children}
      </main>
      <CreatorFooter />
    </div>
  );
}
