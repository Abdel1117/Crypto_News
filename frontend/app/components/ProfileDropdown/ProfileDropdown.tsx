"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { logout } from "@/app/lib/features/auth/authSlice";
import { logoutUser } from "@/app/lib/auth/api";
import { useRouter } from "next/navigation";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* cookie déjà expiré ou réseau */ }
    dispatch(logout());
    setOpen(false);
    router.push("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer shadow-xl"
      >
        {avatarLetter}
      </div>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-surface rounded-xl shadow-lg overflow-hidden z-50 border border-border">
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-primary/10 transition-colors"
          >
            Mon profil
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors hover:cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
