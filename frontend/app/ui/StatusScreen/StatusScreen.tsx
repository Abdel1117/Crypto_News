import Link from "next/link";
import { BrandMark } from "@/app/ui/NocturneIcons/NocturneIcons";

/** Full-page message (404, error): brand, big code, text and actions. */
export function StatusScreen({
  code,
  title,
  children,
  actions,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen px-5 pt-3 pb-8 lg:px-[72px] lg:py-7">
      <Link
        href="/"
        className="flex items-center gap-2.5 self-start min-h-11 no-underline text-(--n-text)!"
      >
        <BrandMark size={24} />
        <span className="text-[15px] lg:text-base font-medium">
          Crypto-Explorer
        </span>
      </Link>
      <main className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-12">
        <p
          aria-hidden="true"
          className="m-0 text-[88px] lg:text-[128px] leading-none font-medium tracking-[-0.04em] text-(--n-accent-400) n-tnum [text-shadow:0_0_48px_color-mix(in_srgb,var(--n-accent)_45%,transparent)]"
        >
          {code}
        </p>
        <h1 className="m-0 text-2xl lg:text-[32px]">{title}</h1>
        <p className="m-0 max-w-[44ch] text-[15px] leading-relaxed text-(--n-neutral-400)">
          {children}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4 w-full sm:w-auto">
          {actions}
        </div>
      </main>
    </div>
  );
}
