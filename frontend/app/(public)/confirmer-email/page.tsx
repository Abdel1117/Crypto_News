import type { Metadata } from "next";
import { Suspense } from "react";
import EmailLinkAction from "@/app/components/EmailLink/EmailLinkAction";

export const metadata: Metadata = {
  title: "Confirmer mon adresse e-mail",
  robots: { index: false, follow: false },
};

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <EmailLinkAction
        path="/auth/email-verification/confirm"
        title="Confirme ton adresse e-mail"
        intro="Une dernière étape pour recevoir tes alertes de prix à cette adresse."
        actionLabel="Confirmer mon adresse"
        successTitle="Adresse confirmée"
        successText="Tu peux maintenant créer des alertes de prix."
      />
    </Suspense>
  );
}
