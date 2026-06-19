import { CATEGORY_META } from "@/app/(public)/blog/data";

export function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 ${meta?.color ?? "text-primary"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {category}
    </span>
  );
}
