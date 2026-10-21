"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useLogout } from "@/app/hooks/useLogout";
import {
  SignOutIcon,
  SquaresFourIcon,
  UserIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

/** Account menu of the public navigation (signed-in visitors). */
export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAppSelector((state) => state.auth);
  const logout = useLogout();
  const avatarLetter = (user?.fullName || user?.email || "?")
    .charAt(0)
    .toUpperCase();
  const label = user?.fullName || user?.email || "Mon compte";

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
    logout();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu du compte (${label})`}
        className="w-10 h-10 rounded-full grid place-items-center border-0 cursor-pointer font-[inherit] text-sm font-medium bg-(--n-accent-800) text-(--n-accent-100) shadow-[0_0_0_1px_color-mix(in_srgb,var(--n-accent)_50%,transparent)] hover:shadow-[0_0_0_1px_var(--n-accent),0_0_18px_-6px_var(--n-accent)]"
      >
        {avatarLetter}
      </button>
      {open && (
        <div role="menu" className="n-menu right-0 top-[calc(100%+8px)] w-56">
          {user?.email && (
            <p className="m-0 px-2.5 pt-1.5 pb-2 text-xs text-(--n-neutral-500) truncate">
              {user.email}
            </p>
          )}
          <Link
            href="/profil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="n-menu-item"
          >
            <UserIcon size={16} />
            Mon profil
          </Link>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="n-menu-item"
          >
            <SquaresFourIcon size={16} />
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="n-menu-item text-(--n-down)!"
          >
            <SignOutIcon size={16} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
