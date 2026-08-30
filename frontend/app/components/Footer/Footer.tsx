import React from "react";
import Link from "next/link";
import { getCurrentYear } from "@/app/utils/Date/DateFormater";
export default function Footer() {
  return (
    <footer className="min-w-full bg-surface py-5 relative z-50 ">
      <div className="flex flex-col items-center justify-center gap-2">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted">
          <Link href="/mentions-legales" className="hover:text-primary hover:underline">
            Mentions légales
          </Link>
          <Link
            href="/politique-de-confidentialite"
            className="hover:text-primary hover:underline"
          >
            Politique de confidentialité
          </Link>
        </nav>
        <p className="text-center">
          © Copyright {getCurrentYear()} Crypto-Explorer Developed by Adjali
          Abderahmane.
        </p>
      </div>
    </footer>
  );
}
