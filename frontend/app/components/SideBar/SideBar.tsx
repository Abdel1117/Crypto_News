"use client";
import React from "react";
import Link from "next/link";
import {
  AuthIcon,
  HomeIcon,
  SimulationIcon,
  SpecialPageIcon,
  UserIcon,
  UtilitiesIcon,
  ArrowLeft,
  ArrowRight,
  DashBoardIcon,
  HeatMapIcon,
} from "@/app/components/Icons";
import { useSidebar } from "@/app/context/SideBar/SideBareContext";
import { useAppSelector } from "@/app/lib/hooks";
import { CryptoLogo } from "../Icons/CryptoLogo";

export default function SideBar() {
  const { isCollapsed, toggle } = useSidebar();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const navItems = [
    { label: "Accueil", href: "/", Icon: HomeIcon },
    { label: "Dashboard", href: "/dashboard", Icon: DashBoardIcon },
    { label: "Simulation", href: "/simulation", Icon: SimulationIcon },
    { label: "Heatmap", href: "/heatmap", Icon: HeatMapIcon },
    isAuthenticated
      ? { label: "Utilisateur", href: "/profil", Icon: UserIcon }
      : { label: "Authentification", href: "/login", Icon: AuthIcon },
    { label: "Utilitaires", href: "/utilities", Icon: UtilitiesIcon },
    { label: "Page Speciales", href: "/specials", Icon: SpecialPageIcon },
  ];

  return (
    <>
      {/* Mobile-only fixed toggle — visible when sidebar is collapsed */}
      <button
        type="button"
        className={[
          "fixed top-4 left-4 z-70",
          "bg-primary p-1.5 rounded-lg cursor-pointer",
          "xl:hidden",
          isCollapsed ? "flex" : "hidden",
        ].join(" ")}
        onClick={toggle}
        aria-label="Expand sidebar"
      >
        <ArrowRight />
      </button>

      <aside
        className={[
          "top-0 left-0 h-screen",
          "bg-surface border-foreground/10",
          // < xl: overlay; animate by width (expand/collapse)
          "fixed z-60",
          "transition-[width] duration-300 ease-in-out",
          isCollapsed
            ? "w-0 border-r-0 overflow-hidden pointer-events-none"
            : "w-64 border-r",
          // >= xl: in-flow rail that pushes content
          "xl:sticky xl:z-auto xl:shrink-0",
          isCollapsed ? "xl:w-20" : "xl:w-64",
          "xl:border-r xl:overflow-hidden xl:pointer-events-auto",
        ].join(" ")}
      >
        <div
          className={[
            "px-5 py-8 border-b border-foreground",
            isCollapsed ? "xl:px-3" : "",
          ].join(" ")}
        >
          <div className="relative flex items-center justify-between">
            <div
              className={[
                "flex items-center gap-2",
                isCollapsed ? "xl:w-full xl:justify-center" : "",
              ].join(" ")}
            >
              <p
                className={[
                  "text-sm text-foreground",
                  isCollapsed ? "xl:hidden" : "",
                ].join(" ")}
              >
                <CryptoLogo />
              </p>
              <h2
                className={[
                  "text-lg font-semibold",
                  isCollapsed ? "xl:hidden" : "",
                ].join(" ")}
              >
                Crypto-Explorer
              </h2>
            </div>

            <button
              type="button"
              className={[
                "bg-primary p-1.5 rounded-lg hover:cursor-pointer",
                "absolute right-2",
              ].join(" ")}
              onClick={toggle}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ArrowRight /> : <ArrowLeft />}
            </button>
          </div>
        </div>

        <nav className="mt-4 px-2 pb-4 flex flex-col gap-2">
          {navItems.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className={[
                "text-sm rounded-lg px-3 py-2 text-foreground/80 hover:outline-1 hover:outline-primary",
                "flex items-center",
                isCollapsed ? "xl:justify-center xl:px-2" : "gap-4",
              ].join(" ")}
            >
              <Icon className="h-6 w-6" aria-hidden="true" focusable="false" />
              <span className={isCollapsed ? "xl:hidden" : ""}>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
