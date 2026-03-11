"use client";
import { ThemeProvider } from "@/app/context/Theme/ThemeContext";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
