"use client";

import { useState } from "react";
import type { PriceAlert } from "@/app/lib/api/alerts";
import { formatDateTime } from "@/app/components/SimulationPro/format";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { describeRule, formatAlertPrice } from "./alertHelpers";

function statusText(alert: PriceAlert): string {
  if (alert.is_active) return "Active";
  if (!alert.triggered_at) return "En pause";
  const when = `Déclenchée le ${formatDateTime(alert.triggered_at)}`;
  return alert.triggered_price === null
    ? when
    : `${when} à ${formatAlertPrice(alert.triggered_price, alert.currency)}`;
}

function AlertRow({
  alert,
  canTurnOn,
  onToggle,
  onDelete,
}: Readonly<{
  alert: PriceAlert;
  canTurnOn: boolean;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}>) {
  const [busy, setBusy] = useState(false);
  const rule = describeRule(alert);
  const run = (action: () => Promise<void>) => async () => {
    setBusy(true);
    await action();
    setBusy(false);
  };

  return (
    <li className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center lg:px-4.5">
      <div className="flex items-center gap-3 min-w-0 sm:mr-auto">
        <CoinAvatar image={alert.image} name={alert.name} symbol={alert.symbol} size={32} />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium truncate">
            {alert.name}{" "}
            <span className="font-normal text-(--n-neutral-500)">{alert.symbol}</span>
          </span>
          <span className="text-sm n-tnum">{rule}</span>
          <span
            className={`text-xs ${alert.is_active ? "text-(--n-accent-300)" : "text-(--n-neutral-400)"}`}
          >
            {statusText(alert)}
          </span>
        </div>
      </div>
      <div className="flex gap-2 flex-none">
        {(alert.is_active || canTurnOn) && (
          <button
            type="button"
            className="n-btn n-btn-secondary text-[13px]! max-sm:flex-1"
            disabled={busy}
            aria-label={`${alert.is_active ? "Mettre en pause" : "Réactiver"} l’alerte ${alert.symbol} ${rule}`}
            onClick={run(onToggle)}
          >
            {alert.is_active ? "Mettre en pause" : "Réactiver"}
          </button>
        )}
        <button
          type="button"
          className="n-btn n-btn-secondary text-[13px]! max-sm:flex-1"
          disabled={busy}
          aria-label={`Supprimer l’alerte ${alert.symbol} ${rule}`}
          onClick={run(onDelete)}
        >
          Supprimer
        </button>
      </div>
    </li>
  );
}

interface AlertListProps {
  alerts: PriceAlert[];
  maxAlerts: number;
  /** Turning an alert on needs a confirmed address and a working service. */
  canTurnOn: boolean;
  onSetActive: (alert: PriceAlert, isActive: boolean) => Promise<void>;
  onDelete: (alert: PriceAlert) => Promise<void>;
}

export default function AlertList({
  alerts,
  maxAlerts,
  canTurnOn,
  onSetActive,
  onDelete,
}: Readonly<AlertListProps>) {
  const [error, setError] = useState<string | null>(null);

  /** Runs an action on a row; a refusal is shown above the list. */
  const guarded = (action: () => Promise<void>) => async () => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="n-panel flex flex-col min-w-0" aria-labelledby="alert-list-title">
      <header className="flex items-baseline justify-between gap-3 px-3.5 pt-4 pb-2 lg:px-4.5">
        <h2 id="alert-list-title" className="m-0 text-base">
          Mes alertes
        </h2>
        <span className="text-xs n-tnum text-(--n-neutral-500)">
          {alerts.length} / {maxAlerts}
        </span>
      </header>

      {error && (
        <p role="alert" className="m-0 px-3.5 pb-2 text-[13px] text-(--n-down) lg:px-4.5">
          {error}
        </p>
      )}

      {alerts.length === 0 ? (
        <p className="m-0 px-3.5 pb-5 text-sm leading-relaxed text-(--n-neutral-400) lg:px-4.5">
          Aucune alerte pour le moment. Par exemple : BTC passe sous 50 000 €, ou
          au-dessus de 85 000 €.
        </p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col divide-y divide-(--n-divider)">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              canTurnOn={canTurnOn}
              onToggle={guarded(() => onSetActive(alert, !alert.is_active))}
              onDelete={guarded(() => onDelete(alert))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
