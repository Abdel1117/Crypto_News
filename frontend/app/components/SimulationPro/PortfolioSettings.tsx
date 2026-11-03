"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import type { CountryCode, CountryRule, ProPortfolio } from "@/app/lib/api/simulationPro";
import {
  changeCountry,
  resetPortfolio,
} from "@/app/lib/features/simulationPro/simulationProThunks";
import { clearSaveError } from "@/app/lib/features/simulationPro/simulationProSlice";
import { CloseIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import OnboardingForm from "./OnboardingForm";

interface PortfolioSettingsProps {
  portfolio: ProPortfolio;
  countries: CountryRule[];
  onClose: () => void;
}

/** Change the country (re-estimates the tax), or start again with new settings. */
export default function PortfolioSettings({ portfolio, countries, onClose }: PortfolioSettingsProps) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector((state) => state.simulationPro);
  const closeRef = useRef<HTMLButtonElement>(null);
  const countryId = useId();
  const [country, setCountry] = useState<CountryCode>(portfolio.country);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    dispatch(clearSaveError());
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dispatch, onClose]);

  const saveCountry = () => {
    dispatch(changeCountry(country))
      .unwrap()
      .then(onClose)
      .catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-90 grid place-items-center p-4 bg-[color-mix(in_srgb,var(--n-bg)_70%,transparent)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-170 max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-5 rounded-[14px] bg-(--n-surface)"
        style={{ boxShadow: "var(--n-shadow-md)" }}
      >
        <div className="flex items-center gap-2">
          <h2 id="settings-title" className="m-0 mr-auto text-lg">
            Paramètres de la simulation
          </h2>
          <button ref={closeRef} type="button" className="n-btn n-btn-icon" onClick={onClose} aria-label="Fermer">
            <CloseIcon size={18} />
          </button>
        </div>

        <section className="flex flex-col gap-2" aria-labelledby="settings-country">
          <h3 id="settings-country" className="m-0 text-base">
            Pays de résidence
          </h3>
          <p className="m-0 text-sm text-(--n-neutral-400)">
            Change seulement l&apos;estimation de l&apos;impôt. Ton capital, ta devise et tes ordres ne bougent pas.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="n-field grow max-w-80">
              <label htmlFor={countryId} className="sr-only">
                Pays de résidence
              </label>
              <select
                id={countryId}
                className="n-text-input"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="n-btn n-btn-primary min-h-12 lg:min-h-10.5"
              disabled={saving || country === portfolio.country}
              onClick={saveCountry}
            >
              Enregistrer
            </button>
          </div>
          {saveError && !showReset && (
            <p role="alert" className="m-0 text-sm text-(--n-down)">
              {saveError}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3 pt-4 border-t border-(--n-divider)" aria-labelledby="settings-reset">
          <h3 id="settings-reset" className="m-0 text-base">
            Recommencer
          </h3>
          <p className="m-0 text-sm text-(--n-neutral-400)">
            Efface tes positions et ton historique, et repars avec un nouveau capital et une nouvelle devise.
          </p>
          {showReset ? (
            <OnboardingForm
              countries={countries}
              mode="reset"
              initial={{
                initial_capital: portfolio.initial_capital,
                currency: portfolio.currency,
                country: portfolio.country,
              }}
              saving={saving}
              error={saveError}
              onSubmit={(settings) => {
                if (
                  window.confirm(
                    "Recommencer la simulation ? Tes positions et ton historique seront définitivement effacés.",
                  )
                ) {
                  dispatch(resetPortfolio(settings))
                    .unwrap()
                    .then(onClose)
                    .catch(() => {});
                }
              }}
            />
          ) : (
            <button type="button" className="n-btn n-btn-secondary self-start" onClick={() => setShowReset(true)}>
              Recommencer la simulation…
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
