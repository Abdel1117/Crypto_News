"use client";

import { useId, useState, type FormEvent } from "react";
import {
  MAX_CAPITAL,
  MIN_CAPITAL,
  type CountryCode,
  type CountryRule,
  type PortfolioCurrency,
  type PortfolioSettings,
} from "@/app/lib/api/simulationPro";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { InfoIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { parseDecimalInput } from "./format";

export const CAPITAL_PRESETS = [1000, 5000, 10000, 25000, 50000];

interface OnboardingFormProps {
  countries: CountryRule[];
  /** "create": first portfolio; "reset": start again with new settings. */
  mode: "create" | "reset";
  initial?: Partial<PortfolioSettings>;
  saving: boolean;
  error: string | null;
  onSubmit: (settings: PortfolioSettings) => void;
}

const formatCapital = (v: number) =>
  v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export default function OnboardingForm({
  countries,
  mode,
  initial,
  saving,
  error,
  onSubmit,
}: OnboardingFormProps) {
  const ids = { capital: useId(), country: useId(), hint: useId(), error: useId() };
  const firstCountry = initial?.country ?? "FR";
  const [capitalText, setCapitalText] = useState(
    String(initial?.initial_capital ?? 10000),
  );
  const [currency, setCurrency] = useState<PortfolioCurrency>(
    initial?.currency ??
      countries.find((c) => c.code === firstCountry)?.default_currency ??
      "eur",
  );
  const [country, setCountry] = useState<CountryCode>(firstCountry);

  const capital = parseDecimalInput(capitalText);
  const capitalValid =
    Number.isFinite(capital) &&
    capital >= MIN_CAPITAL &&
    capital <= MAX_CAPITAL &&
    // At most 2 decimals (with a tolerance for float rounding, e.g. 1234.56 × 100).
    Math.abs(Math.round(capital * 100) - capital * 100) < 1e-6;
  const rule = countries.find((c) => c.code === country);
  const symbol = CURRENCY_SYMBOLS[currency];

  const changeCountry = (code: CountryCode) => {
    setCountry(code);
    // The country presets the currency; it can still be changed afterwards.
    const next = countries.find((c) => c.code === code);
    if (next) setCurrency(next.default_currency);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!capitalValid || saving) return;
    onSubmit({ initial_capital: capital, currency, country });
  };

  return (
    <form
      onSubmit={submit}
      className="n-panel flex flex-col gap-5 p-5 lg:p-6 max-w-160"
      aria-labelledby="onboarding-title"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="onboarding-title" className="m-0 text-lg">
          {mode === "create" ? "Crée ton portefeuille de simulation" : "Recommencer la simulation"}
        </h2>
        <p className="m-0 text-sm text-(--n-neutral-400) leading-normal">
          Choisis ton capital de départ et ton pays de résidence. Chaque ordre
          coûte 0,1 % de frais, et l&apos;impôt sur tes plus-values est estimé
          selon les règles de ton pays.
        </p>
      </div>

      <div className="n-field">
        <label htmlFor={ids.capital}>Capital de départ</label>
        <div className="relative">
          <input
            id={ids.capital}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={capitalText}
            onChange={(e) => setCapitalText(e.target.value)}
            className="n-text-input n-tnum pr-10!"
            aria-invalid={!capitalValid}
            aria-describedby={ids.hint}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-(--n-neutral-400)" aria-hidden="true">
            {symbol}
          </span>
        </div>
        <input
          type="range"
          min={MIN_CAPITAL}
          max={MAX_CAPITAL}
          step={500}
          value={capitalValid ? capital : Math.min(Math.max(capital || MIN_CAPITAL, MIN_CAPITAL), MAX_CAPITAL)}
          onChange={(e) => setCapitalText(e.target.value)}
          className="w-full accent-(--n-accent) mt-2"
          aria-label="Capital de départ"
        />
        <div className="flex flex-wrap gap-2 mt-1" role="group" aria-label="Montants proposés">
          {CAPITAL_PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              className="n-btn n-btn-secondary text-[13px]! px-2.5!"
              aria-pressed={capital === v}
              onClick={() => setCapitalText(String(v))}
            >
              {formatCapital(v)} {symbol}
            </button>
          ))}
        </div>
        <p
          id={ids.hint}
          className={`m-0 mt-1 text-xs ${capitalValid ? "text-(--n-neutral-500)" : "text-(--n-down)"}`}
        >
          Entre {formatCapital(MIN_CAPITAL)} et {formatCapital(MAX_CAPITAL)} {symbol}.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">Devise du portefeuille</span>
        <div className="n-seg flex! max-w-70" role="group" aria-label="Devise du portefeuille">
          {(
            [
              ["eur", "Euro (€)"],
              ["usd", "Dollar ($)"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="n-seg-btn"
              aria-pressed={currency === value}
              onClick={() => setCurrency(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="n-field">
        <label htmlFor={ids.country}>Pays de résidence</label>
        <select
          id={ids.country}
          value={country}
          onChange={(e) => changeCountry(e.target.value as CountryCode)}
          className="n-text-input"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {rule && (
          <p className="m-0 mt-2 flex gap-2 text-[13px] leading-normal text-(--n-neutral-400)">
            <InfoIcon size={14} className="flex-none mt-0.5" />
            <span>{rule.summary}</span>
          </p>
        )}
      </div>

      {error && (
        <p id={ids.error} role="alert" className="m-0 text-sm text-(--n-down)">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="n-btn n-btn-primary min-h-12 lg:min-h-10.5 self-start px-5!"
        disabled={!capitalValid || saving || countries.length === 0}
      >
        {saving
          ? "Enregistrement…"
          : mode === "create"
            ? "Commencer la simulation"
            : "Recommencer avec ces paramètres"}
      </button>
    </form>
  );
}
