"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

interface SidebarCtx {
  isCollapsed: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // `isCollapsed` drives 2 behaviors:
  // - < xl: sidebar slides off-canvas (overlay)
  // - >= xl: sidebar collapses to an icon-only rail (push content)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const value = useMemo(
    () => ({
      isCollapsed,
      open: () => setIsCollapsed(false),
      close: () => setIsCollapsed(true),
      toggle: () => setIsCollapsed((v) => !v),
    }),
    [isCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
