"use client";

import { ThemeProvider } from "@/app/context/Theme/ThemeContext";
import { SidebarProvider } from "@/app/context/SideBar/SideBareContext";
import { ReduxProvider } from "@/app/providers/redux-provider";
import { SocketProvider } from "@/app/providers/socket-provider";
import { CurrencyProvider } from "../context/Curency/CurrencyContext";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <SocketProvider>
        <SidebarProvider>
          <CurrencyProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </CurrencyProvider>
        </SidebarProvider>
      </SocketProvider>
    </ReduxProvider>
  );
}
