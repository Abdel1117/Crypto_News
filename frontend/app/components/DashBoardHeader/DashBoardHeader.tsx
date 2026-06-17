"use client";
import { useState } from "react";
import UserBar from "../../components/UserBar/UserBar";
import { MobileMenuIcon } from "../Icons";

export default function DashBoardHeader() {
  const [toogleMobileMenu, setToogleMobileMenu] = useState<boolean>(false);
  return (
    <header className="relative">
      <div className="px-6 flex justify-between items-center h-20 min-w-full">
        <h2 className="text-[20px] font-bold text-foreground">Dashboard</h2>

        {/* Desktop userbar */}
        <div className="hidden lg:block">
          <UserBar />
        </div>

        {/* Mobile menu button */}
        <div className="block lg:hidden">
          <button
            className="rounded-lg p-1 hover:cursor-pointer"
            onClick={() => setToogleMobileMenu((old) => !old)}
            aria-label={toogleMobileMenu ? "Close menu" : "Open menu"}
          >
            <MobileMenuIcon width={20} height={20} />
          </button>
        </div>
      </div>

      {/* Bottom row (mobile only): UserBar */}
      <div
        className={[
          "lg:hidden",
          "fixed top-20 right-0 z-70",
          "w-full",
          "bg-surface",
          "transition-[max-height,opacity,transform] duration-300 ease-in-out",
          toogleMobileMenu
            ? "max-h-60 opacity-100 translate-y-0 pointer-events-auto overflow-visible"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden",
        ].join(" ")}
      >
        <div className="w-full px-4 py-3">
          <UserBar className="w-full flex items-center justify-end gap-2" />
        </div>
      </div>
    </header>
  );
}
