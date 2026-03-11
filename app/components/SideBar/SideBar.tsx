"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  AuthIcon,
  HomeIcon,
  SpecialPageIcon,
  UserIcon,
  UtilitiesIcon,
  ArrowLeft,
  ArrowRight,
} from "@/app/components/Icons";
import { useSidebar } from "@/app/context/SideBar/SideBareContext";

export default function SideBar() {
  const { isOpen, toggle } = useSidebar();
  const navItems = [
    { label: "Dashboard", href: "/dashboard", Icon: HomeIcon },
    { label: "Page Speciales", href: "/", Icon: SpecialPageIcon },
    { label: "Authentification", href: "/login", Icon: AuthIcon },
    { label: "Utilisateur", href: "/settinngs", Icon: UserIcon },
    { label: "Utilitaires", href: "/utilities", Icon: UtilitiesIcon },
  ] as const;

  return (
    <aside
      className={[
        "fixed top-0 left-0 z-[60] h-screen w-64",
        "bg-surface border-r border-foreground/10",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "-translate-x-full" : "translate-x-0",
      ].join(" ")}
    >
      <div
        className={`transition-opacity duration-200 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="px-5 py-8 flex items-center justify-between border-b border-foreground ">
          <div className="flex items-center ">
            <p className="text-sm text-foreground">App</p>
            <h2 className="text-lg font-semibold">Crypto News</h2>
            <button
              type="button"
              className="bg-primary p-1.5 rounded-lg hover:cursor-pointer  absolute right-2"
              onClick={() => {
                toggle();
              }}
              aria-label={isOpen ? "Open sidebar" : "Close sidebar"}
            >
              {isOpen ? <ArrowRight /> : <ArrowLeft />}
            </button>
          </div>
        </div>

        <nav className="mt-4 px-2 pb-4 flex flex-col gap-2">
          {navItems.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className=" text-sm rounded-lg px-3 py-2 text-foreground/80 hover:outline-1 hover:outline-primary flex items-center gap-4"
            >
              <Icon className="h-6 w-6" aria-hidden="true" focusable="false" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
