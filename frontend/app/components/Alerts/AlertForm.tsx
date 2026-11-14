"use client";

import React, { useId, useState } from "react";
import { useCurrency, type Currency } from "@/app/context/Curency/CurrencyContext";
import type { AlertDirection, NewAlert } from "@/app/lib/api/alerts";
import { OrderReason } from "@/app/components/Simulation/OrderParts";
import {
  CoinSearchField,
  useCoinSearch,
  useQuote,
  type CoinChoice,
} from "@/app/components/SimulationPro/ProTradeForm";
import { CURRENCY_SYMBOLS } from "@/app/utils/constants/currency";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";
import { alertBlocker, toApiThreshold } from "./alertHelpers";

const DIRECTIONS: { value: AlertDirection; label: string }[] = [
  { value: "below", label: "Passe sous" },
  { value: "above", label: "Passe au-dessus" },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "eur", label: "EUR" },
  { value: "usd", label: "USD" },
];

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: Readonly<{
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}>) {
  return (
    <fieldset className="n-seg flex! min-w-0" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="n-seg-btn"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}

interface AlertFormProps {
  onCreate: (alert: NewAlert) => Promise<void>;
  /** The account already has as many alerts as allowed. */
  limitReached: boolean;
  maxAlerts: number;
}

export default function AlertForm({
  onCreate,
  limitReached,
  maxAlerts,
}: Readonly<AlertFormProps>) {
  const { currency: displayCurrency } = useCurrency();
  const ids = { search: useId(), threshold: useId(), reason: useId() };

  const [coin, setCoin] = useState<CoinChoice | null>(null);
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<Currency>(displayCurrency);
  const [direction, setDirection] = useState<AlertDirection>("below");
  const [thresholdText, setThresholdText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCoinSearch(query, coin === null);
  const quote = useQuote(currency, coin);

  const limitMessage = limitReached
    ? `Limite de ${maxAlerts} alertes atteinte. Supprimes-en une pour en créer une nouvelle.`
    : null;
  const reason =
    limitMessage ??
    alertBlocker({
      hasCoin: coin !== null,
      thresholdText,
      direction,
      price: quote.price,
    });
  const canSubmit =
    coin !== null && thresholdText.trim() !== "" && reason === null && !saving;

  const choose = (next: CoinChoice | null) => {
    setCoin(next);
    setQuery("");
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !coin) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        coin_id: coin.id,
        currency,
        direction,
        threshold: toApiThreshold(thresholdText),
      });
      setThresholdText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="n-panel flex flex-col gap-4 p-4.5"
      aria-labelledby="alert-form-title"
    >
      <h2 id="alert-form-title" className="m-0 text-base">
        Nouvelle alerte
      </h2>

      <CoinSearchField
        inputId={ids.search}
        reasonId={ids.reason}
        selected={coin}
        query={query}
        onQueryChange={setQuery}
        search={search}
        onChoose={choose}
      />

      <Choice
        label="Devise de l’alerte"
        options={CURRENCIES}
        value={currency}
        onChange={setCurrency}
      />

      {quote.price !== null && (
        <p className="-mt-2 mb-0 text-xs text-(--n-neutral-400)">
          Prix actuel {formatFiatPrice(quote.price, currency)}
        </p>
      )}
      {quote.failed && (
        <p className="-mt-2 mb-0 text-xs text-(--n-neutral-400)">
          Prix actuel indisponible.
        </p>
      )}

      <Choice
        label="Condition de l’alerte"
        options={DIRECTIONS}
        value={direction}
        onChange={setDirection}
      />

      <div className="n-field">
        <label htmlFor={ids.threshold}>
          Seuil ({CURRENCY_SYMBOLS[currency]})
        </label>
        <input
          id={ids.threshold}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={thresholdText}
          onChange={(e) => {
            setThresholdText(e.target.value);
            setError(null);
          }}
          placeholder="50 000"
          className="n-text-input n-tnum"
          aria-invalid={Boolean(thresholdText) && reason !== null && coin !== null}
          aria-describedby={reason ? ids.reason : undefined}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="n-btn n-btn-primary w-full min-h-12 lg:min-h-10.5 max-lg:text-[15px]!"
      >
        {saving ? "Création…" : "Créer l’alerte"}
      </button>

      {error ? (
        <p role="alert" className="m-0 text-[13px] text-(--n-down)">
          {error}
        </p>
      ) : (
        <OrderReason id={ids.reason} reason={reason} />
      )}
    </form>
  );
}
