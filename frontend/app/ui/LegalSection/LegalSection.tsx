import React from "react";

const RULE =
  "linear-gradient(to right, transparent, var(--n-divider) 48px, var(--n-divider) calc(100% - 48px), transparent) no-repeat top / 100% 1px";

/** One numbered-free block of a legal page: title, then prose. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex flex-col gap-3 py-7 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:py-9"
      style={{ background: RULE }}
    >
      <h2 className="m-0 text-lg lg:text-[19px] leading-snug">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-7 text-[color-mix(in_srgb,var(--n-text)_78%,transparent)] [&_p]:m-0 [&_ul]:m-0 marker:text-(--n-accent) [&_strong]:font-medium [&_strong]:text-(--n-text)">
        {children}
      </div>
    </section>
  );
}

export function LegalPageHeader({
  eyebrow,
  title,
  highlight,
  updatedAt,
}: {
  eyebrow: string;
  title: string;
  highlight: string;
  updatedAt: string;
}) {
  return (
    <header className="pb-8 lg:pb-12">
      <span className="n-eyebrow">{eyebrow}</span>
      <h1 className="mt-3.5 mb-0 text-[32px] leading-[1.1] lg:mt-4 lg:text-[44px]">
        {title} <span className="text-(--n-accent-400)">{highlight}</span>
      </h1>
      <p className="mt-3 mb-0 text-sm text-(--n-neutral-500)">
        Dernière mise à jour : {updatedAt}
      </p>
    </header>
  );
}
