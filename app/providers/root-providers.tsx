"use client";

import { ThemeProvider } from "@/app/context/Theme/ThemeContext";
import { SidebarProvider } from "@/app/context/SideBar/SideBareContext";
import { ReduxProvider } from "@/app/providers/redux-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <SidebarProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </SidebarProvider>
    </ReduxProvider>
  );
}
