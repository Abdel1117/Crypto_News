import SideBar from "../components/SideBar/SideBar";
import DashBoardHeader from "../components/DashBoardHeader/DashBoardHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
