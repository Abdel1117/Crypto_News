import Link from "next/link";
import { getCurrentYear } from "@/app/utils/Date/DateFormater";
import CookieSettingsLink from "./CookieSettingsLink";

// Kept apart from LandingSections: the public pages share this footer, and
// importing it from there would ship the landing animations (anime.js) to them.
export default function LandingFooter() {
  return (
    <footer className="relative mx-5 pt-5 pb-7 flex flex-col-reverse gap-2.5 text-xs text-(--n-neutral-500) lg:mx-[120px] lg:pt-6 lg:pb-8 lg:flex-row lg:items-center lg:gap-6 lg:text-[13px]">
      <div className="n-rule" />
      <span className="lg:mr-auto">
        © {getCurrentYear()} Crypto-Explorer · Développé par Adjali Abderahmane
      </span>
      <nav className="flex gap-[18px] lg:gap-6" aria-label="Liens légaux">
        <Link
          href="/mentions-legales"
          className="inline-flex items-center min-h-11 lg:min-h-0 no-underline text-(--n-neutral-400)! hover:text-(--n-accent)!"
        >
          Mentions légales
        </Link>
        <Link
          href="/politique-de-confidentialite"
          className="inline-flex items-center min-h-11 lg:min-h-0 no-underline text-(--n-neutral-400)! hover:text-(--n-accent)!"
        >
          Politique de confidentialité
        </Link>
        <CookieSettingsLink className="inline-flex items-center min-h-11 lg:min-h-0 text-(--n-neutral-400) hover:text-(--n-accent)" />
      </nav>
    </footer>
  );
}
