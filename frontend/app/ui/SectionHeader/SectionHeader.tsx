import Link from "next/link";

export function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-primary inline-block" />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-xs text-primary hover:underline font-medium"
        >
          Voir tout →
        </Link>
      )}
    </div>
  );
}
