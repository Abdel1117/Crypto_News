"use client";

import { useEffect, useRef, useState } from "react";
import {
  useConsent,
  COOKIE_CATEGORIES,
  ConsentPreferences,
} from "@/app/context/Consent/ConsentContext";
import { CloseIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import CategoryToggleRow from "../CategoryToggleRow/CategoryToggleRow";

type OptionalPreferences = Pick<ConsentPreferences, "analytics" | "marketing">;

export default function ConsentPreferencesPanel() {
  const {
    preferences,
    savePreferences,
    acceptAll,
    rejectAll,
    closePreferencesPanel,
  } = useConsent();
  const [draft, setDraft] = useState<OptionalPreferences>({
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreferencesPanel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [closePreferencesPanel]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/55"
        onClick={closePreferencesPanel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        className="relative flex flex-col gap-4 w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-5 rounded-[14px] bg-(--n-surface)"
        style={{ boxShadow: "var(--n-shadow-md)" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1 mr-auto">
            <h2 id="cookie-preferences-title" className="m-0 text-lg">
              Préférences de cookies
            </h2>
            <p className="m-0 text-[13px] leading-relaxed text-(--n-neutral-400)">
              Choisissez les cookies que vous autorisez. Vous pouvez modifier ce
              choix à tout moment.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closePreferencesPanel}
            aria-label="Fermer"
            className="n-btn n-btn-icon flex-none -mr-2 -mt-1.5 text-(--n-neutral-400)! hover:text-(--n-text)!"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div
          className="flex flex-col gap-px rounded-lg overflow-hidden"
          style={{
            background:
              "color-mix(in srgb, var(--n-text) 8%, var(--n-surface))",
          }}
        >
          <CategoryToggleRow category={COOKIE_CATEGORIES.necessary} checked />
          <CategoryToggleRow
            category={COOKIE_CATEGORIES.analytics}
            checked={draft.analytics}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, analytics: checked }))
            }
          />
          <CategoryToggleRow
            category={COOKIE_CATEGORIES.marketing}
            checked={draft.marketing}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, marketing: checked }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => savePreferences(draft)}
            className="n-btn n-btn-secondary col-span-2 sm:mr-auto min-h-11 sm:min-h-9"
          >
            Enregistrer mes choix
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="n-btn n-btn-primary min-h-11 sm:min-h-9"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="n-btn n-btn-primary min-h-11 sm:min-h-9"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
