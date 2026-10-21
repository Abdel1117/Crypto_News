"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useTheme } from "@/app/context/Theme/ThemeContext";
import ProfileDropdown from "../ProfileDropdown/ProfileDropdown";
import {
  BrandMark,
  CloseIcon,
  ListIcon,
  MoonIcon,
  SunIcon,
} from "./LandingIcons";

const NAV_LINKS = [
  { label: "Accueil", href: "/", current: true },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Contact", href: "#contact" },
];

const noopSubscribe = () => () => {};

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  // false during SSR/hydration, true afterwards: the theme is only known client-side.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return <span className="w-10 h-10" aria-hidden="true" />;

  return (
    <button
      type="button"
      className="n-btn n-btn-icon"
      onClick={toggleTheme}
      aria-label={
        theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"
      }
    >
      {theme === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
    </button>
  );
}

function AuthAction() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (isAuthenticated) return <ProfileDropdown />;
  return (
    <Link href="/login" className="n-btn n-btn-primary min-h-10 lg:min-h-0">
      Connexion
    </Link>
  );
}

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="relative z-50">
      <nav
        className="flex items-center gap-2 h-[60px] pl-[18px] pr-1.5 lg:gap-6 lg:h-auto lg:px-[120px] lg:py-[18px]"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 mr-auto no-underline text-(--n-text)!"
          onClick={close}
        >
          <BrandMark />
          <span className="text-base lg:text-[17px] font-medium whitespace-nowrap">
            Crypto-Explorer
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="n-nav-link"
              aria-current={l.current ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        <AuthAction />

        <button
          type="button"
          className="n-btn n-btn-icon w-11! h-11! lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
        >
          {open ? <CloseIcon size={22} /> : <ListIcon size={22} />}
        </button>
      </nav>

      {open && (
        <div
          id="landing-mobile-menu"
          className="lg:hidden absolute inset-x-3 top-[60px] flex flex-col gap-1 p-3 rounded-[14px] bg-(--n-surface)"
          style={{ boxShadow: "var(--n-shadow-md)" }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="n-nav-link flex items-center min-h-11 px-2 text-[15px]!"
              aria-current={l.current ? "page" : undefined}
              onClick={close}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center justify-between min-h-11 pl-2">
            <span className="text-[15px]">Thème</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
