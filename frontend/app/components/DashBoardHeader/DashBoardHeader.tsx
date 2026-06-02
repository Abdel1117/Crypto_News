"use client";
import { useState } from "react";
import UserBar from "../../components/UserBar/UserBar";
import { MobileMenuIcon } from "../Icons";
import { useSidebar } from "@/app/context/SideBar/SideBareContext";

export default function DashBoardHeader() {
  const { toggle } = useSidebar();

  const [toogleMobileMenu, setToogleMobileMenu] = useState<boolean>(false);
  return (
    <header className="relative">
      <div className="px-6 flex justify-between items-center h-20 min-w-full">
        <button
          onClick={() => toggle()}
          className="bg-primary p-1 rounded-lg hover:cursor-pointer xl:hidden"
        >
          <svg
            width="20"
            height="20"
            fill="currentColor"
            className="bi bi-arrow-right-short"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"
            />
          </svg>
        </button>
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
          "overflow-hidden",
          "transition-[max-height,opacity,transform] duration-300 ease-in-out",
          toogleMobileMenu
            ? "max-h-24 opacity-100 translate-y-0 pointer-events-auto"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none",
        ].join(" ")}
      >
        <div className="w-full px-4 py-3">
          <UserBar className="w-full flex items-center justify-end gap-2" />
        </div>
      </div>
    </header>
  );
}
