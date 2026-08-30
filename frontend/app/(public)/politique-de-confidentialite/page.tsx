import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageHeader, LegalSection } from "@/app/ui/LegalSection/LegalSection";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Crypto-Explorer : données collectées, cookies, finalités et vos droits RGPD.",
  openGraph: {
    title: "Politique de confidentialité – Crypto-Explorer",
    description:
      "Politique de confidentialité de Crypto-Explorer : données collectées, cookies, finalités et vos droits RGPD.",
    url: "/politique-de-confidentialite",
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="page-transition min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 sm:py-14">
        <LegalPageHeader
          eyebrow="Vie privée & RGPD"
          title="Politique de"
          highlight="confidentialité"
          updatedAt="29 août 2026"
        />

        <LegalSection title="Responsable du traitement">
          <p>
            Crypto-Explorer est un projet personnel édité et développé par un
            développeur unique, Adjali Abderahmane, responsable du traitement
            des données décrites ci-dessous.
          </p>
          <p>
            Contact :{" "}
            <a
              href="mailto:contact@crypto-explorer.fr"
              className="text-primary hover:underline"
            >
              contact@crypto-explorer.fr
            </a>
          </p>
        </LegalSection>

        <LegalSection title="Données collectées et finalités">
          <p>Selon votre utilisation du site, nous traitons :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Compte utilisateur</strong>{" "}
              : nom complet, adresse e-mail et mot de passe (stocké sous
              forme hachée, jamais en clair) lors d&apos;une inscription
              classique, ou nom, e-mail et photo de profil transmis par
              Google lors d&apos;une connexion via Google Sign-In —
              nécessaires à la création et à la sécurisation de votre
              compte ;
            </li>
            <li>
              <strong className="text-foreground">
                Authentification
              </strong>{" "}
              : jetons de session (JWT) déposés dans des cookies
              strictement nécessaires (httpOnly, sécurisés) pour vous
              maintenir connecté en toute sécurité ;
            </li>
            <li>
              <strong className="text-foreground">
                Utilisation du service
              </strong>{" "}
              : votre watchlist et l&apos;historique de votre portefeuille
              simulé (aucun mouvement d&apos;argent réel) sont associés à
              votre compte pour vous permettre de les retrouver ;
            </li>
            <li>
              <strong className="text-foreground">
                Formulaire de contact
              </strong>{" "}
              : nom, e-mail et message, transmis par e-mail à
              l&apos;éditeur pour traiter votre demande ;
            </li>
            <li>
              <strong className="text-foreground">
                Préférences et mesure d&apos;audience
              </strong>{" "}
              : votre choix de consentement aux cookies (stocké dans votre
              navigateur) et, si vous l&apos;acceptez, des statistiques de
              fréquentation anonymisées.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Base légale des traitements">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              L&apos;exécution du contrat, pour la création de compte,
              l&apos;authentification et la fourniture des fonctionnalités
              du site (watchlist, simulation de portefeuille) ;
            </li>
            <li>
              Le consentement, pour les cookies de mesure d&apos;audience et
              tout futur cookie marketing, recueilli via le bandeau et
              révocable à tout moment ;
            </li>
            <li>
              L&apos;intérêt légitime, pour la sécurité du site et la
              réponse à vos demandes via le formulaire de contact.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Cookies et traceurs">
          <p>
            Un bandeau de consentement vous permet d&apos;accepter, de
            refuser ou de personnaliser les cookies non essentiels lors de
            votre première visite, et de modifier ce choix à tout moment via
            le bouton dédié en bas de page. Trois catégories sont utilisées :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">
                Strictement nécessaires
              </strong>{" "}
              (toujours actifs) : session d&apos;authentification (JWT),
              sécurité et mémorisation de votre choix de cookies. Ils ne
              nécessitent pas votre consentement.
            </li>
            <li>
              <strong className="text-foreground">
                Mesure d&apos;audience
              </strong>{" "}
              (soumis à consentement) : statistiques de fréquentation via
              Plausible Analytics, un outil respectueux de la vie privée. Ces
              statistiques ne sont chargées qu&apos;après votre accord
              explicite.
            </li>
            <li>
              <strong className="text-foreground">
                Marketing et publicité
              </strong>{" "}
              (soumis à consentement) : catégorie prévue par notre gestionnaire
              de consentement ; à ce jour, aucun cookie marketing
              n&apos;est déposé sur le site.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Destinataires des données">
          <p>
            Vos données ne sont ni vendues, ni louées, ni partagées à des
            fins commerciales. Elles peuvent être transmises aux
            prestataires techniques strictement nécessaires au
            fonctionnement du site : hébergeur (Hostinger), service
            d&apos;authentification Google (si vous choisissez de vous
            connecter via Google) et service d&apos;envoi d&apos;e-mails pour
            le formulaire de contact.
          </p>
        </LegalSection>

        <LegalSection title="Durée de conservation">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Données de compte : conservées tant que votre compte est
              actif, puis supprimées sur simple demande ;
            </li>
            <li>
              Cookies d&apos;authentification : durée de la session, selon
              la configuration du jeton (access token de courte durée,
              refresh token de plus longue durée) ;
            </li>
            <li>
              Choix de consentement aux cookies : conservé dans votre
              navigateur jusqu&apos;à ce que vous le modifiiez ou effaciez
              vos données de navigation ;
            </li>
            <li>
              Messages du formulaire de contact : conservés le temps
              nécessaire au traitement de votre demande.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Sécurité des données">
          <p>
            Les mots de passe sont stockés sous forme hachée. Les échanges
            avec le site sont chiffrés (HTTPS) et les cookies
            d&apos;authentification sont configurés en httpOnly et strict
            pour limiter les risques d&apos;accès non autorisé ou de vol de
            session.
          </p>
        </LegalSection>

        <LegalSection title="Vos droits">
          <p>
            Conformément au Règlement Général sur la Protection des Données
            (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un
            droit d&apos;accès, de rectification, d&apos;effacement, de
            limitation, d&apos;opposition et de portabilité de vos données,
            ainsi que du droit de retirer votre consentement à tout moment
            (via le bouton de gestion des cookies en bas de page).
          </p>
          <p>
            Pour exercer ces droits, contactez{" "}
            <a
              href="mailto:contact@crypto-explorer.fr"
              className="text-primary hover:underline"
            >
              contact@crypto-explorer.fr
            </a>
            . Vous disposez également du droit d&apos;introduire une
            réclamation auprès de la Commission Nationale de
            l&apos;Informatique et des Libertés (CNIL) — 3 Place de
            Fontenoy, TSA 80715, 75334 Paris Cedex 07,{" "}
            <span className="text-foreground">www.cnil.fr</span>.
          </p>
        </LegalSection>

        <LegalSection title="Mineurs">
          <p>
            Le site n&apos;est pas destiné aux personnes mineures. Les
            fonctionnalités de compte et de simulation de portefeuille
            s&apos;adressent à des utilisateurs majeurs.
          </p>
        </LegalSection>

        <LegalSection title="Modification de cette politique">
          <p>
            Cette politique peut être mise à jour pour refléter des
            évolutions du site ou de la réglementation. En cas de
            changement substantiel des catégories de cookies ou de leur
            finalité, votre consentement vous sera à nouveau demandé.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Pour toute question relative à cette politique ou à vos
            données, écrivez à{" "}
            <a
              href="mailto:contact@crypto-explorer.fr"
              className="text-primary hover:underline"
            >
              contact@crypto-explorer.fr
            </a>
            . Pour l&apos;identité de l&apos;éditeur et de
            l&apos;hébergeur, consultez nos{" "}
            <Link href="/mentions-legales" className="text-primary hover:underline">
              mentions légales
            </Link>
            .
          </p>
        </LegalSection>
      </div>
    </main>
  );
}
