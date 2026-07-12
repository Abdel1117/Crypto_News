import type { Metadata } from "next";
import SideBar from "../components/SideBar/SideBar";
import DashBoardHeader from "../components/DashBoardHeader/DashBoardHeader";
import SymbolsBootstrap from "../components/SymbolsBootstrap/SymbolsBootstrap";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SymbolsBootstrap />
      <div className="flex min-h-screen">
        <SideBar />

        <div className="min-w-0 flex flex-col w-full">
          <DashBoardHeader />
          <main className="flex-1 p-1 md:p-6 ">{children}</main>
        </div>
      </div>
    </div>
  );
}
