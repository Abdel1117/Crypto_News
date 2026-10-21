"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark, GearIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { APP_NAV, isCurrent } from "./appNav";
import UserMenu from "./UserMenu";

/** Desktop sidebar (≥ lg). On mobile, MobileTabBar takes over. */
export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-60 flex-none flex-col gap-6 px-3.5 py-[18px]">
      <div
        className="absolute inset-y-0 right-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--n-divider) 48px, var(--n-divider) calc(100% - 48px), transparent)",
        }}
      />
      <Link
        href="/"
        className="flex items-center gap-2.5 px-2 py-1.5 no-underline text-(--n-text)!"
      >
        <BrandMark size={24} />
        <span className="text-[15px] font-medium whitespace-nowrap">
          Crypto-Explorer
        </span>
        <span className="n-tag bg-(--n-accent-800) text-(--n-accent-100) px-[7px]! py-px! text-[10px]!">
          Bêta
        </span>
      </Link>

      <nav
        className="flex flex-col gap-0.5"
        aria-label="Navigation de l’application"
      >
        {APP_NAV.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className="n-side-link"
            aria-current={isCurrent(pathname, href) ? "page" : undefined}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5">
        <Link
          href="/settings"
          className="n-side-link"
          aria-current={isCurrent(pathname, "/settings") ? "page" : undefined}
        >
          <GearIcon size={18} />
          Paramètres
        </Link>
        <UserMenu />
      </div>
    </aside>
  );
}
