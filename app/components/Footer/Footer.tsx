import React from "react";
import { getCurrentYear } from "@/app/utils/Date/DateFormater";
export default function Footer() {
  return (
    <footer className="min-w-full bg-surface py-5">
      <div className="flex justify-center items-center">
        <p className="text-center">
          © Copyright {getCurrentYear()} Crypto News Developed by Adjali
          Abderahmane.
        </p>
      </div>
    </footer>
  );
}
