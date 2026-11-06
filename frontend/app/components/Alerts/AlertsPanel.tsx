"use client";

import { useState } from "react";
import { EnvelopeIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import AlertForm from "./AlertForm";
import AlertList from "./AlertList";
import { describeInterval } from "./alertHelpers";
import { useAlerts } from "./useAlerts";

function ConfirmEmailNotice({
  email,
  onSend,
}: Readonly<{ email: string; onSend: () => Promise<void> }>) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setState("sending");
    setError(null);
    try {
      await onSend();
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  };

  return (
    <section className="n-panel flex flex-col gap-3 p-4.5" aria-labelledby="confirm-email-title">
      <h2 id="confirm-email-title" className="m-0 text-base">
        Confirme ton adresse e-mail
      </h2>
      <p className="m-0 text-sm leading-relaxed text-(--n-neutral-300)">
        Les alertes sont envoyées à <strong className="break-words">{email}</strong>.
        Confirme d’abord que cette adresse est bien la tienne : une seule fois suffit.
      </p>
      {state === "sent" ? (
        <output className="block text-sm leading-relaxed text-(--n-accent-300)">
          E-mail envoyé. Clique sur le lien qu’il contient : cette page se mettra à
          jour à ton retour.
        </output>
      ) : (
        <button
          type="button"
          className="n-btn n-btn-primary w-full min-h-12 lg:min-h-10.5 max-lg:text-[15px]!"
          disabled={state === "sending"}
          onClick={send}
        >
          <EnvelopeIcon />
          {state === "sending" ? "Envoi…" : "Envoyer le lien de confirmation"}
        </button>
      )}
      {error && (
        <p role="alert" className="m-0 text-[13px] text-(--n-down)">
          {error}
        </p>
      )}
    </section>
  );
}

/** The alerts page: create alerts, see and manage them. */
export default function AlertsPanel() {
  const { overview, loadError, reload, add, setActive, remove, sendConfirmation } = useAlerts();

  if (!overview) {
    if (!loadError) {
      return <div className="n-skeleton min-h-[240px]" aria-busy="true" aria-label="Chargement" />;
    }
    return (
      <div className="n-panel flex flex-col items-start gap-3 p-4.5">
        <p role="alert" className="m-0 text-sm text-(--n-down)">
          {loadError}
        </p>
        <button type="button" className="n-btn n-btn-secondary" onClick={reload}>
          Réessayer
        </button>
      </div>
    );
  }

  const { items, email, email_verified, alerts_available, max_alerts, check_interval_seconds } = overview;
  const canTurnOn = alerts_available && email_verified;

  return (
    <div className="flex flex-col gap-5 lg:max-w-[1040px] lg:pt-2">
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-3 min-w-0">
          {!alerts_available && (
            <output className="n-panel block m-0 p-4.5 text-sm leading-relaxed text-(--n-neutral-300)">
              Les alertes ne sont pas disponibles pour le moment. Tes alertes
              existantes sont conservées.
            </output>
          )}
          {alerts_available && !email_verified && (
            <ConfirmEmailNotice email={email} onSend={sendConfirmation} />
          )}
          {canTurnOn && (
            <>
              <AlertForm
                onCreate={add}
                limitReached={items.length >= max_alerts}
                maxAlerts={max_alerts}
              />
              <p className="m-0 text-xs leading-relaxed text-(--n-neutral-500)">
                Les prix sont vérifiés {describeInterval(check_interval_seconds)} : un
                mouvement plus court peut passer inaperçu. Une alerte ne se déclenche
                qu’une fois, puis tu peux la réactiver. Information de marché, pas un
                conseil en investissement.
              </p>
            </>
          )}
        </div>

        <AlertList
          alerts={items}
          maxAlerts={max_alerts}
          canTurnOn={canTurnOn}
          onSetActive={setActive}
          onDelete={remove}
        />
      </div>
    </div>
  );
}
