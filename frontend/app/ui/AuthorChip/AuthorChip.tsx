/** Author initial, name and reading time. */
export function AuthorChip({
  initial,
  name,
  readTime,
  onCover = false,
}: {
  initial: string;
  name: string;
  date?: string;
  readTime: string;
  onCover?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs ${
        onCover ? "text-white/70" : "text-(--n-neutral-400)"
      }`}
    >
      <span
        aria-hidden="true"
        className="w-6 h-6 flex-none rounded-full grid place-items-center text-[10px] font-medium bg-(--n-accent-800) text-(--n-accent-100)"
      >
        {initial}
      </span>
      <span>{name}</span>
      <span aria-hidden="true">·</span>
      <span>{readTime} de lecture</span>
    </div>
  );
}
