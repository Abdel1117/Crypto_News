import { Inter } from "next/font/google";
import "@/app/components/Landing/landing.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`nocturne ${inter.variable} overflow-x-clip`}>
      {children}
    </div>
  );
}
