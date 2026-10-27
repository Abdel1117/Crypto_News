"use client";

import Link from "next/link";
import { useConsent } from "@/app/context/Consent/ConsentContext";
import { CookieIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import ConsentPreferencesPanel from "../ConsentPreferencesPanel/ConsentPreferencesPanel";

export default function CookieBanner() {
  const {
    needsConsent,
    acceptAll,
    rejectAll,
    openPreferencesPanel,
    isPreferencesPanelOpen,
  } = useConsent();

  if (isPreferencesPanelOpen) {
    return <ConsentPreferencesPanel />;
  }

  if (!needsConsent) {
    // Consent has already been recorded — leave a small, permanent way to
    // change it later, per the "modifiable at any time" requirement.
    return (
      <button
        type="button"
        onClick={openPreferencesPanel}
        aria-label="Gérer mes préférences de cookies"
        className="n-cookie-fab n-btn n-btn-icon fixed left-4 lg:left-auto lg:right-5 z-40 rounded-full! bg-(--n-surface)! text-(--n-neutral-400)! hover:text-(--n-text)! shadow-(--n-shadow-sm)"
      >
        <CookieIcon size={18} />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
      className="fixed inset-x-3 bottom-3 z-[75] flex flex-col gap-4 p-4 rounded-[14px] bg-(--n-surface) lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[460px] lg:p-5"
      style={{ boxShadow: "var(--n-shadow-md)" }}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="flex-none w-9 h-9 rounded-full grid place-items-center bg-(--n-accent-800) text-(--n-accent-100)"
        >
          <CookieIcon size={18} />
        </span>
        <div className="flex flex-col gap-1">
          <p id="cookie-banner-title" className="m-0 text-[15px] font-medium">
            Respect de votre vie privée
          </p>
          <p
            id="cookie-banner-text"
            className="m-0 text-[13px] leading-relaxed text-(--n-neutral-400)"
          >
            Nous utilisons des cookies strictement nécessaires au fonctionnement
            et à la sécurité du site, sans votre consentement. Avec votre
            accord, nous pouvons aussi mesurer l’audience et utiliser des
            cookies marketing. En savoir plus dans notre{" "}
            <Link href="/politique-de-confidentialite">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
      {/* Refusing is exactly as easy and as visible as accepting (CNIL). */}
      <div className="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
        <button
          type="button"
          onClick={openPreferencesPanel}
          className="n-btn col-span-2 lg:mr-auto min-h-11 lg:min-h-9 lg:px-1.5! text-(--n-accent)! hover:bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
        >
          Personnaliser
        </button>
        <button
          type="button"
          onClick={rejectAll}
          className="n-btn n-btn-primary min-h-11 lg:min-h-9 lg:px-3.5!"
        >
          Tout refuser
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="n-btn n-btn-primary min-h-11 lg:min-h-9 lg:px-3.5!"
        >
          Tout accepter
        </button>
      </div>
    </div>
  );
}
