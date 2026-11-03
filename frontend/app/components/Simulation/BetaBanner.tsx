import Link from "next/link";
import { InfoIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

/** Above the beta simulation: what the logged-in version adds. */
export default function BetaBanner() {
  return (
    <aside
      className="n-panel mb-[18px] lg:mb-4 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--n-accent)_30%,transparent)]"
      aria-label="Version bêta"
    >
      <InfoIcon size={18} className="flex-none text-(--n-accent) hidden sm:block" />
      <p className="m-0 mr-auto text-sm leading-normal">
        <strong className="font-medium">Version bêta.</strong>{" "}
        <span className="text-(--n-neutral-400)">
          Connecte-toi pour choisir ton capital, la fiscalité de ton pays et
          suivre tes performances, sur tous tes appareils.
        </span>
      </p>
      <Link href="/login" className="n-btn n-btn-primary self-start sm:self-auto">
        Se connecter
      </Link>
    </aside>
  );
}
