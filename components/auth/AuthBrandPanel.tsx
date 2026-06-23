import Image from "next/image";
import { Logo } from "@/components/brand/Logo";
import { APP_TAGLINE } from "@/lib/config";

// Seed thumbnail collage — reuses UI-2 assets, slightly rotated for energy
const COLLAGE = [
  { src: "/seed/social-instagram-story.svg", rotate: "-rotate-3", z: "z-30", top: "top-[12%]", left: "left-[8%]", size: 140 },
  { src: "/seed/deck-pitch.svg", rotate: "rotate-2", z: "z-20", top: "top-[28%]", left: "left-[42%]", size: 160 },
  { src: "/seed/font-lagos-display.svg", rotate: "-rotate-1", z: "z-10", top: "top-[52%]", left: "left-[18%]", size: 130 },
  { src: "/seed/mockup-phone.svg", rotate: "rotate-3", z: "z-40", top: "top-[62%]", left: "left-[55%]", size: 110 },
];

export function AuthBrandPanel() {
  return (
    <div className="relative flex h-full min-h-screen flex-col overflow-hidden bg-brand-green-900">
      {/* Depth gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(200,115,46,0.08) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 80% 80%, rgba(26,61,47,0.6) 0%, transparent 70%)",
        }}
      />

      {/* Logo — top left */}
      <div className="relative z-50 p-10">
        <Logo variant="mark" tone="cream" size={48} />
      </div>

      {/* Tagline — bottom left */}
      <div className="relative z-50 mt-auto p-10 pb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-cream-300">
          {"// Creative resources"}
        </p>
        <p
          className="mt-3 max-w-[280px] font-heading text-2xl leading-snug text-cream-100"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {APP_TAGLINE}
        </p>
        <div className="mt-6 h-px w-12 bg-terracotta-500 opacity-80" />
      </div>

      {/* Collage of UI-2 thumbnails */}
      {COLLAGE.map((item, i) => (
        <div
          key={i}
          className={[
            "absolute overflow-hidden rounded-xl border border-white/10 shadow-xl",
            item.rotate,
            item.z,
            item.top,
            item.left,
          ].join(" ")}
          style={{ width: item.size, height: item.size }}
        >
          <Image
            src={item.src}
            alt=""
            width={item.size}
            height={item.size}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
