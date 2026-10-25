import { Inter } from "next/font/google";

// Nocturne typeface, exposed as --font-inter on the .nocturne wrapper.
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
