/** Author initial, name, reading time and (optionally) the date. */
export function AuthorChip({
  initial,
  name,
  readTime,
  date,
  dateTime,
  onCover = false,
}: Readonly<{
  initial: string;
  name: string;
  readTime: string;
  date?: string;
  /** Machine-readable date for the <time> element. */
  dateTime?: string;
  onCover?: boolean;
}>) {
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
      {date && (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={dateTime}>{date}</time>
        </>
      )}
    </div>
  );
}
