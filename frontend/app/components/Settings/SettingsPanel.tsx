"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/app/context/Theme/ThemeContext";
import {
  useCurrency,
  type Currency,
} from "@/app/context/Curency/CurrencyContext";
import {
  COOKIE_CATEGORIES,
  useConsent,
} from "@/app/context/Consent/ConsentContext";
import { SettingsList, SettingsRow } from "@/app/ui/SettingsList/SettingsList";
import { MoonIcon, SunIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

const noopSubscribe = () => () => {};

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: React.ReactNode }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="n-seg flex! lg:inline-flex! self-start max-lg:w-full"
      role="group"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="n-seg-btn gap-1.5 lg:flex-none! lg:px-4!"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="m-0 text-[13px] text-(--n-neutral-500)">{children}</p>
);

/** App preferences: theme, display currency and cookie consent. */
export default function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { preferences, consentedAt, openPreferencesPanel } = useConsent();
  // The stored theme is only known in the browser.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const consentDate = consentedAt
    ? new Date(consentedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <SettingsList className="lg:max-w-[880px]">
      <SettingsRow title="Apparence">
        <div className="flex flex-col gap-2">
          <Segmented
            label="Thème"
            value={mounted ? theme : null}
            onChange={setTheme}
            options={[
              {
                value: "light",
                label: (
                  <>
                    <SunIcon size={14} />
                    Clair
                  </>
                ),
              },
              {
                value: "dark",
                label: (
                  <>
                    <MoonIcon size={14} />
                    Sombre
                  </>
                ),
              },
            ]}
          />
          <Hint>Le thème est mémorisé sur cet appareil.</Hint>
        </div>
      </SettingsRow>

      <SettingsRow title="Devise">
        <div className="flex flex-col gap-2">
          <Segmented<Currency>
            label="Devise d’affichage"
            value={currency}
            onChange={setCurrency}
            options={[
              { value: "eur", label: "EUR · Euro" },
              { value: "usd", label: "USD · Dollar" },
            ]}
          />
          <Hint>
            S’applique aux prix, aux graphiques et au portefeuille virtuel.
          </Hint>
        </div>
      </SettingsRow>

      <SettingsRow title="Cookies" last>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          <div className="flex flex-col gap-1.5 mr-auto min-w-0">
            {consentedAt ? (
              <ul className="m-0 p-0 list-none flex flex-col gap-1 text-sm">
                {(["analytics", "marketing"] as const).map((id) => (
                  <li key={id} className="flex gap-2">
                    <span className="text-(--n-neutral-300)">
                      {COOKIE_CATEGORIES[id].title}
                    </span>
                    <span
                      className={
                        preferences[id]
                          ? "text-(--n-up)"
                          : "text-(--n-neutral-500)"
                      }
                    >
                      {preferences[id] ? "Accepté" : "Refusé"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-(--n-neutral-300)">
                Aucun choix enregistré pour le moment.
              </p>
            )}
            {consentDate && <Hint>Choix enregistré le {consentDate}.</Hint>}
          </div>
          <button
            type="button"
            className="n-btn n-btn-secondary flex-none self-start min-h-11 lg:min-h-0"
            onClick={openPreferencesPanel}
          >
            Gérer mes préférences
          </button>
        </div>
      </SettingsRow>
    </SettingsList>
  );
}
