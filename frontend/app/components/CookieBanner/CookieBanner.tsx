"use client";

import { useConsent } from "@/app/context/Consent/ConsentContext";
import { ParamIcons } from "@/app/components/Icons";
import ConsentPreferencesPanel from "../ConsentPreferencesPanel/ConsentPreferencesPanel";

export default function CookieBanner() {
  const { needsConsent, acceptAll, rejectAll, openPreferencesPanel, isPreferencesPanelOpen } =
    useConsent();

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
        className="fixed bottom-4 left-4 z-40 rounded-full border border-foreground/10 bg-card p-2.5 text-muted shadow-md transition-colors hover:text-foreground"
      >
        <ParamIcons className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-card px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p id="cookie-banner-title" className="text-sm font-semibold text-foreground">
            Respect de votre vie privée
          </p>
          <p className="mt-1 text-sm text-muted">
            Nous utilisons des cookies strictement nécessaires au fonctionnement et à la
            sécurité du site. Ces cookies ne nécessitent pas votre consentement. Avec votre
            accord, nous pouvons également utiliser des cookies de mesure d&rsquo;audience et
            marketing.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={openPreferencesPanel}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Personnaliser
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
