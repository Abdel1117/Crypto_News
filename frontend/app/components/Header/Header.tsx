"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ThemeButton } from "../ThemeButton/ThemeButton";
import { useAppSelector } from "@/app/lib/hooks";

type NavItem = {
  label: string;
  href: string;
};

const NAV_LINKS: NavItem[] = [
  { label: "Dash board", href: "/dashboard" },
  { label: "Blogs", href: "#blog" },
  { label: "Contact", href: "#contact" },
  { label: "Projects", href: "#projects" },
];

function NavLinks({
  onNavigate,
  className = "",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <>
      {NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          className={className}
          href={item.href}
          onClick={onNavigate}
          data-testid={`nav-link-${item.label.toLowerCase()}`}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export default function Header() {
  const [navbar, setNavbar] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?";

  const STICKY_OFFSET = 25;

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY >= STICKY_OFFSET);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerHeightClass = "h-[72px]";

  const toggleNavbar = () => setNavbar((v) => !v);
  const closeNavbar = () => setNavbar(false);

  return (
    <>
      <nav
        className={[
          "w-full left-0 right-0 transition-colors duration-300",
          isSticky
            ? "fixed top-0 z-50 bg-background shadow-md"
            : "relative z-10 bg-transparent",
        ].join(" ")}
        data-testid="header-nav"
      >
        <div className="px-4 mx-auto md:items-center md:flex md:justify-between lg:px-28">
          <div
            className={[
              "flex items-center justify-between w-full",
              headerHeightClass,
            ].join(" ")}
          >
            <Link
              className="flex items-center justify-center h-full"
              href="/"
              onClick={closeNavbar}
            >
              <h2 className="text-2xl text-cyan-600 font-bold">LOGO</h2>
            </Link>

            <div
              className="hidden lg:flex items-center gap-6"
              data-testid="desktop-nav"
            >
              <NavLinks className="text-base text-color-foreground hover:text-purple-600" />

              <ThemeButton />
              {isAuthenticated ? (
                <Link href="/settings">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer shadow-xl">
                    {avatarLetter}
                  </div>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="hover:cursor-pointer px-5 py-2.5 bg-primary font-semibold rounded-lg transition-all duration-300 transform shadow-xl">
                    Login
                  </button>
                </Link>
              )}
            </div>

            {/* Tablet/Mobile actions (<lg): Theme + Menu + Login */}
            <div
              className="lg:hidden flex items-center gap-3"
              data-testid="mobile-actions"
            >
              <ThemeButton />
              {isAuthenticated ? (
                <Link href="/settings" className="hidden sm:inline-flex">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer shadow-xl">
                    {avatarLetter}
                  </div>
                </Link>
              ) : (
                <Link
                  className="hidden sm:inline-flex hover:cursor-pointer px-4 py-2 bg-slate-light dark:bg-primary text-white-light dark:text-black font-semibold rounded-lg transition-all duration-300 transform shadow-xl"
                  href="/login"
                >
                  Login
                </Link>
              )}

              <button
                className="p-2 rounded-md outline-none focus:border-gray-400 focus:border text-foreground hover:cursor-pointer"
                onClick={toggleNavbar}
                aria-label={navbar ? "Close navigation" : "Open navigation"}
                aria-expanded={navbar}
                aria-controls="mobile-menu"
                data-testid="menu-toggle"
              >
                {navbar ? (
                  // Close (X)
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="block"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  // Hamburger
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="block"
                  >
                    <path
                      d="M4 6h16M4 12h16M4 18h16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown menu (mobile/tablet) */}
        <div
          id="mobile-menu"
          className={[
            "lg:hidden absolute top-full left-0 w-full z-50 overflow-hidden origin-top",
            "transition-[max-height,opacity,transform] duration-200 ease-out",
            navbar
              ? "max-h-[500px] opacity-100 scale-y-100 pointer-events-auto"
              : "max-h-0 opacity-0 scale-y-95 pointer-events-none",
          ].join(" ")}
          data-testid="mobile-menu"
        >
          <div className="lg:px-28">
            <div className="bg-surface p-6">
              <div className="flex flex-col gap-4">
                <NavLinks
                  onNavigate={closeNavbar}
                  className="text-base text-foreground hover:outline-1 hover:outline-primary rounded-lg p-2"
                />

                <div className="visible sm:hidden">
                  {isAuthenticated ? (
                    <Link
                      className="text-base text-foreground"
                      href="/profil"
                      onClick={closeNavbar}
                      data-testid="nav-link-profile"
                    >
                      Profile
                    </Link>
                  ) : (
                    <Link
                      className="text-base text-foreground"
                      href="/login"
                      onClick={closeNavbar}
                      data-testid="nav-link-login"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
