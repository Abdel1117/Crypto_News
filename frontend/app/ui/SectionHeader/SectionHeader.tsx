import Link from "next/link";
import { ArrowRightIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

/** Section title with an optional count and « Voir tout » link. */
export function SectionHeader({
  title,
  href,
  count,
}: {
  title: string;
  href?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <h2 className="m-0 text-lg">{title}</h2>
      {typeof count === "number" && (
        <span className="text-[13px] text-(--n-neutral-500)">{count}</span>
      )}
      {href && (
        <Link
          href={href}
          className="ml-auto inline-flex items-center gap-1 text-[13px] no-underline"
        >
          Voir tout
          <ArrowRightIcon size={14} />
        </Link>
      )}
    </div>
  );
}
