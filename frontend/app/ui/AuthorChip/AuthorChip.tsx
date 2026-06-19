export function AuthorChip({
  initial,
  name,
  date,
  readTime,
}: {
  initial: string;
  name: string;
  date: string;
  readTime: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-black shrink-0">
        {initial}
      </div>
      <span className="text-xs text-white/70">{name}</span>
      <span className="text-white/30 text-xs">·</span>
      <span className="text-xs text-white/50">{readTime}</span>
    </div>
  );
}
