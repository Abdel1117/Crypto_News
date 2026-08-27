"use client";

import { useState } from "react";
import { useConsent, COOKIE_CATEGORIES, ConsentPreferences } from "../useConsent";
import CategoryToggleRow from "./CategoryToggleRow";

type OptionalPreferences = Pick<ConsentPreferences, "analytics" | "marketing">;

export default function ConsentPreferencesPanel() {
  const { preferences, savePreferences, acceptAll, rejectAll, closePreferencesPanel } =
    useConsent();
  const [draft, setDraft] = useState<OptionalPreferences>({
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-preferences-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={closePreferencesPanel}
          aria-label="Fermer"
          className="absolute right-4 top-4 text-muted transition-colors hover:text-foreground"
        >
          ✕
        </button>

        <h2 id="cookie-preferences-title" className="pr-6 text-lg font-semibold text-foreground">
          Préférences de cookies
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choisissez les cookies que vous autorisez. Vous pouvez modifier ce choix à tout
          moment.
        </p>

        <div className="mt-4 space-y-3">
          <CategoryToggleRow category={COOKIE_CATEGORIES.necessary} checked={true} />
          <CategoryToggleRow
            category={COOKIE_CATEGORIES.analytics}
            checked={draft.analytics}
            onChange={(checked) => setDraft((prev) => ({ ...prev, analytics: checked }))}
          />
          <CategoryToggleRow
            category={COOKIE_CATEGORIES.marketing}
            checked={draft.marketing}
            onChange={(checked) => setDraft((prev) => ({ ...prev, marketing: checked }))}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={() => savePreferences(draft)}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Enregistrer mes choix
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
