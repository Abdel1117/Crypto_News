"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/app/lib/hooks";
import { UserIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { APP_NAV, isCurrent } from "./appNav";

/** Bottom tab bar replacing the sidebar below lg. */
export default function MobileTabBar() {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const profileHref = isAuthenticated ? "/profil" : "/login";
  const items = [
    ...APP_NAV,
    { label: "Profil", href: profileHref, Icon: UserIcon },
  ];

  return (
    <nav
      className="n-tabbar lg:hidden fixed inset-x-0 bottom-0 z-60 grid grid-cols-5 px-1 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-md bg-[color-mix(in_srgb,color-mix(in_srgb,var(--n-surface)_40%,var(--n-bg))_92%,transparent)]"
      aria-label="Navigation de l’application"
    >
      <div className="n-rule" />
      {items.map(({ label, href, Icon }) => (
        <Link
          key={label}
          href={href}
          className="n-tab-link"
          aria-current={isCurrent(pathname, href) ? "page" : undefined}
        >
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
