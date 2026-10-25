import LandingNav from "@/app/components/Landing/LandingNav";
import { LandingFooter } from "@/app/components/Landing/LandingSections";

/** Blog and legal pages: the landing page's nav and footer around the content. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen overflow-x-clip">
      <div className="mx-auto w-full max-w-[1440px]">
        <LandingNav />
      </div>
      <div className="flex-1">{children}</div>
      <div className="mx-auto w-full max-w-[1440px]">
        <LandingFooter />
      </div>
    </div>
  );
}
