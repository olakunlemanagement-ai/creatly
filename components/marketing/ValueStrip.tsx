import { Reveal } from "@/components/shared/Reveal";

const items = [
  "Templates, fonts, mockups & more",
  "New assets added weekly",
  "Pay in Naira (NGN)",
  "Made for African creatives",
] as const;

export function ValueStrip() {
  return (
    <Reveal>
      <div className="border-y border-terracotta-200 bg-terracotta-50 px-4 py-6 sm:px-6">
        <ul className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-0 sm:divide-x sm:divide-terracotta-200">
          {items.map((item) => (
            <li
              key={item}
              className="text-sm font-medium text-terracotta-700 sm:px-6"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
