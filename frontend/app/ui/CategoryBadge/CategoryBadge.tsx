import type { CSSProperties } from "react";
import { categoryHue } from "@/app/(public)/blog/data";

/** Style that tints an element (cover, label) with a category's hue. */
export const categoryStyle = (category: string) =>
  ({ "--cat-h": categoryHue(category) }) as CSSProperties;

/** Category label, tinted with the category hue (or light, over a cover). */
export function CategoryBadge({
  category,
  onCover = false,
}: {
  category: string;
  onCover?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] uppercase ${
        onCover ? "text-white/85" : "n-cat"
      }`}
      style={categoryStyle(category)}
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full ${onCover ? "bg-white/85" : "bg-current"}`}
      />
      {category}
    </span>
  );
}
