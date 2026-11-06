import type { Metadata } from "next";
import { Suspense } from "react";
import EmailLinkAction from "@/app/components/EmailLink/EmailLinkAction";

export const metadata: Metadata = {
  title: "Désactiver mes alertes",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <Suspense>
      <EmailLinkAction
        path="/alerts/unsubscribe"
        title="Désactiver mes alertes"
        intro="Toutes tes alertes de prix seront désactivées : tu ne recevras plus d’e-mail d’alerte."
        actionLabel="Désactiver toutes mes alertes"
        successTitle="Alertes désactivées"
        successText="Tu ne recevras plus d’e-mail d’alerte. Tu peux réactiver tes alertes à tout moment depuis ton compte."
      />
    </Suspense>
  );
}
