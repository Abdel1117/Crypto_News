"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ThemeButton } from "../ThemeButton/ThemeButton";
import Close from "@/public/icons/svg/close-menu.svg";
import HamburgerMenu from "@/public/icons/svg/mobile-menu.svg";

type NavItem = {
  label: string;
  href: string;
};

const NAV_LINKS: NavItem[] = [
  { label: "About", href: "#about" },
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

              <button className="hover:cursor-pointer px-5 py-2.5 bg-primary font-semibold rounded-lg transition-all duration-300 transform shadow-xl">
                Login
              </button>
            </div>

            {/* Tablet/Mobile actions (<lg): Theme + Menu + Login */}
            <div
              className="lg:hidden flex items-center gap-3"
              data-testid="mobile-actions"
            >
              <ThemeButton />

              <button className="hidden sm:inline-flex hover:cursor-pointer px-4 py-2 bg-slate-light dark:bg-green-500 text-white-light dark:text-black font-semibold rounded-lg transition-all duration-300 transform shadow-xl">
                Login
              </button>

              <button
                className="p-2 text-white rounded-md outline-none focus:border-gray-400 focus:border"
                onClick={toggleNavbar}
                aria-label="Toggle navigation"
                aria-expanded={navbar}
                aria-controls="mobile-menu"
                data-testid="menu-toggle"
              >
                {navbar ? (
                  <Image src={Close} width={30} height={30} alt="close" />
                ) : (
                  <Image
                    src={HamburgerMenu}
                    width={30}
                    height={30}
                    alt="menu"
                  />
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
            <div className="bg-red-900 p-6">
              <div className="flex flex-col gap-4">
                <NavLinks
                  onNavigate={closeNavbar}
                  className="text-base text-foreground"
                />

                {/* Login uniquement sur xs (comme tu fais déjà) */}
                <div className="visible sm:hidden">
                  <Link
                    className="text-base text-foreground"
                    href="/login"
                    onClick={closeNavbar}
                    data-testid="nav-link-login"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
