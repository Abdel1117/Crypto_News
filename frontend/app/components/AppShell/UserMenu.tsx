"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useLogout } from "@/app/hooks/useLogout";
import { useTheme } from "@/app/context/Theme/ThemeContext";
import {
  CaretUpDownIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
  UserIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

const noopSubscribe = () => () => {};

function ThemeMenuItem() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return (
    <button type="button" className="n-menu-item" onClick={toggleTheme}>
      {theme === "light" ? <MoonIcon size={16} /> : <SunIcon size={16} />}
      {theme === "light" ? "Mode sombre" : "Mode clair"}
    </button>
  );
}

/** Bottom-of-sidebar account block: profile, theme and logout in a menu. */
export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const logoutAndLeave = useLogout();
  const onProfile = usePathname() === "/profil";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logoutAndLeave();
  };

  const displayName = user?.fullName?.split(" ")[0] || user?.email || "Invité";
  const avatarLetter = (user?.fullName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          className="n-menu left-0 right-0 bottom-[calc(100%+6px)]"
          role="menu"
        >
          {isAuthenticated && (
            <Link
              href="/profil"
              role="menuitem"
              className="n-menu-item"
              onClick={() => setOpen(false)}
            >
              <UserIcon size={16} />
              Mon profil
            </Link>
          )}
          <ThemeMenuItem />
          {isAuthenticated ? (
            <button
              type="button"
              role="menuitem"
              className="n-menu-item text-(--n-down)!"
              onClick={handleLogout}
            >
              <SignOutIcon size={16} />
              Se déconnecter
            </button>
          ) : (
            <Link
              href="/login"
              role="menuitem"
              className="n-menu-item"
              onClick={() => setOpen(false)}
            >
              <UserIcon size={16} />
              Connexion
            </Link>
          )}
        </div>
      )}
      <button
        type="button"
        className={`flex items-center gap-2.5 w-full p-2.5 rounded-lg border-0 cursor-pointer text-left font-[inherit] text-(--n-text) ${
          onProfile
            ? "bg-[color-mix(in_srgb,var(--n-accent)_14%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--n-accent)_40%,transparent)]"
            : "bg-[color-mix(in_srgb,var(--n-text)_4%,transparent)] hover:bg-[color-mix(in_srgb,var(--n-text)_8%,transparent)]"
        }`}
        aria-current={onProfile ? "page" : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="w-[30px] h-[30px] flex-none rounded-full grid place-items-center text-[13px] font-medium bg-(--n-accent-800) text-(--n-accent-100)">
          {isAuthenticated ? avatarLetter : <UserIcon size={16} />}
        </span>
        <span className="flex flex-col leading-[1.3] min-w-0">
          <span className="text-[13px] font-medium truncate">
            {isAuthenticated ? displayName : "Invité"}
          </span>
          <span
            className={`text-xs ${onProfile ? "text-(--n-accent-300)" : "text-(--n-neutral-500)"}`}
          >
            {!isAuthenticated
              ? "Se connecter"
              : onProfile
                ? "Profil"
                : "Voir le profil"}
          </span>
        </span>
        <CaretUpDownIcon size={14} className="ml-auto text-(--n-neutral-500)" />
      </button>
    </div>
  );
}
