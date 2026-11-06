import type { ComponentType, SVGProps } from "react";
import {
  BellIcon,
  ChartLineUpIcon,
  GridFourIcon,
  HouseIcon,
  SquaresFourIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export type AppNavItem = { label: string; href: string; Icon: NavIcon };

// Only pages that exist: "Utilitaires" and "Pages spéciales" stay hidden until they do.
export const APP_NAV: AppNavItem[] = [
  { label: "Accueil", href: "/", Icon: HouseIcon },
  { label: "Dashboard", href: "/dashboard", Icon: SquaresFourIcon },
  { label: "Simulation", href: "/simulation", Icon: ChartLineUpIcon },
  { label: "Heatmap", href: "/heatmap", Icon: GridFourIcon },
  { label: "Alertes", href: "/alertes", Icon: BellIcon },
];

export interface PageConfig {
  title: string;
  /** Small neutral tag next to the title (desktop / mobile wording). */
  tag?: { desktop: string; mobile: string };
  /** Crypto search in the top bar (dashboard). */
  search?: boolean;
  /** Currency switch in the top bar. */
  currency?: boolean;
}

const PAGES: Record<string, PageConfig> = {
  "/dashboard": { title: "Dashboard", search: true, currency: true },
  "/simulation": {
    title: "Portefeuille virtuel",
    tag: { desktop: "Argent fictif", mobile: "Fictif" },
    currency: true,
  },
  "/heatmap": { title: "Heatmap du marché", currency: true },
  // No currency switch: each alert has its own currency.
  "/alertes": { title: "Alertes de prix" },
  "/profil": { title: "Profil" },
  "/settings": { title: "Paramètres", currency: true },
};

const FALLBACK: PageConfig = { title: "Crypto-Explorer", currency: true };

export function pageConfig(
  pathname: string,
  auth?: { isAuthenticated: boolean },
): PageConfig {
  const match = Object.keys(PAGES).find(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
  const config = match ? PAGES[match] : FALLBACK;
  if (match === "/simulation" && auth) {
    // Logged in: the portfolio has its own fixed currency, so no switch.
    // Logged out: the browser-only beta.
    return auth.isAuthenticated
      ? { ...config, currency: false }
      : { ...config, tag: { desktop: "Bêta · argent fictif", mobile: "Bêta" } };
  }
  return config;
}

export function pageTitle(pathname: string): string {
  return pageConfig(pathname).title;
}

export function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
