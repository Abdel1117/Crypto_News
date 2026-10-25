"use client";

import { createContext, useContext } from "react";

export interface AppSearchCtx {
  /** Opens the crypto search (focuses the header field, or the mobile panel). */
  openSearch: () => void;
}

export const AppSearchContext = createContext<AppSearchCtx | null>(null);

export function useAppSearch(): AppSearchCtx {
  const ctx = useContext(AppSearchContext);
  if (!ctx) throw new Error("useAppSearch must be used within AppShell");
  return ctx;
}
