"use client";

import { ThemeProvider } from "@/app/context/Theme/ThemeContext";
import { ReduxProvider } from "@/app/providers/redux-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ReduxProvider>
  );
}
