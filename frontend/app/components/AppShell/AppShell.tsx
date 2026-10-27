"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BrandMark,
  CloseIcon,
  SearchIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import { DESKTOP_QUERY } from "@/app/hooks/useMediaQuery";
import AppSidebar from "./AppSidebar";
import MobileTabBar from "./MobileTabBar";
import ChatWidget from "../ChatWidget/ChatWidget";
import CoinSearch from "./CoinSearch";
import CurrencyMenu from "./CurrencyMenu";
import { AppSearchContext } from "./SearchContext";
import { HeaderSlotsContext } from "./HeaderSlots";
import { pageConfig } from "./appNav";

/**
 * Nocturne frame shared by every page of the (app) group: sidebar on desktop,
 * a top bar configured per page (title, search, currency, page actions), and
 * a bottom tab bar on mobile.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const page = pageConfig(pathname);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [titleSlot, setTitleSlot] = useState<HTMLElement | null>(null);
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  const openSearch = useCallback(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      desktopSearchRef.current?.focus();
    } else {
      setMobileSearchOpen(true);
    }
  }, []);

  // Ctrl/Cmd + K opens the search on pages that have one.
  useEffect(() => {
    if (!page.search) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch, page.search]);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchRef.current?.focus();
  }, [mobileSearchOpen]);

  const searchCtx = useMemo(() => ({ openSearch }), [openSearch]);
  const slots = useMemo(
    () => ({ title: titleSlot, actions: actionsSlot }),
    [titleSlot, actionsSlot],
  );

  return (
    <AppSearchContext.Provider value={searchCtx}>
      <HeaderSlotsContext.Provider value={slots}>
        <div className="flex min-h-screen">
          <AppSidebar />

          <div className="flex flex-col flex-1 min-w-0 bg-[radial-gradient(520px_360px_at_92%_-80px,color-mix(in_srgb,var(--n-accent-900)_75%,transparent),transparent_60%),var(--n-bg)] lg:bg-[radial-gradient(900px_520px_at_88%_-140px,color-mix(in_srgb,var(--n-accent-900)_70%,transparent),transparent_60%),var(--n-bg)]">
            <header className="relative z-40 flex items-center gap-2 lg:gap-2.5 h-[60px] pl-4 pr-1.5 lg:h-16 lg:px-7">
              {page.search && (
                <Link
                  href="/"
                  className="lg:hidden flex mr-1"
                  aria-label="Accueil"
                >
                  <BrandMark size={24} />
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-x-2 lg:gap-x-3 mr-auto min-w-0">
                <h1 className="m-0 text-lg lg:text-xl leading-tight">
                  {page.title}
                </h1>
                {page.tag && (
                  <span className="n-tag n-tag-neutral max-lg:text-[10px]!">
                    <span className="lg:hidden">{page.tag.mobile}</span>
                    <span className="hidden lg:inline">{page.tag.desktop}</span>
                  </span>
                )}
                <div ref={setTitleSlot} className="contents" />
              </div>
              <div ref={setActionsSlot} className="contents" />
              {page.search && (
                <CoinSearch
                  ref={desktopSearchRef}
                  className="hidden lg:block w-[340px]"
                  showShortcut
                />
              )}
              {page.currency && (
                <CurrencyMenu
                  className={page.search ? "" : "hidden lg:block"}
                />
              )}
              {page.search && (
                <button
                  type="button"
                  className="n-btn n-btn-icon w-11! h-11! lg:hidden!"
                  aria-label={
                    mobileSearchOpen
                      ? "Fermer la recherche"
                      : "Rechercher une crypto"
                  }
                  aria-expanded={mobileSearchOpen}
                  onClick={() => setMobileSearchOpen((v) => !v)}
                >
                  {mobileSearchOpen ? (
                    <CloseIcon size={20} />
                  ) : (
                    <SearchIcon size={20} />
                  )}
                </button>
              )}
            </header>

            {page.search && mobileSearchOpen && (
              <div className="lg:hidden relative z-30 px-4 pb-3">
                <CoinSearch
                  ref={mobileSearchRef}
                  onClose={() => setMobileSearchOpen(false)}
                />
              </div>
            )}

            <main className="flex-1 min-w-0 px-4 pt-1 pb-[96px] lg:px-7 lg:pt-2 lg:pb-8">
              {children}
            </main>
          </div>
        </div>

        <MobileTabBar />
        <ChatWidget />
      </HeaderSlotsContext.Provider>
    </AppSearchContext.Provider>
  );
}
