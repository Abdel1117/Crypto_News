import type { Metadata } from "next";
import AppShell from "../components/AppShell/AppShell";
import SymbolsBootstrap from "../components/SymbolsBootstrap/SymbolsBootstrap";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SymbolsBootstrap />
      <AppShell>{children}</AppShell>
    </>
  );
}
