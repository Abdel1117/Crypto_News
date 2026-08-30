import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageHeader, LegalSection } from "@/app/ui/LegalSection/LegalSection";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de Crypto-Explorer : éditeur, hébergement, propriété intellectuelle et responsabilité.",
  openGraph: {
    title: "Mentions légales – Crypto-Explorer",
    description:
      "Mentions légales de Crypto-Explorer : éditeur, hébergement, propriété intellectuelle et responsabilité.",
    url: "/mentions-legales",
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="page-transition min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 sm:py-14">
        <LegalPageHeader
          eyebrow="Informations légales"
          title="Mentions"
          highlight="légales"
          updatedAt="29 août 2026"
        />

        <LegalSection title="Éditeur du site">
          <p>
            Le site Crypto-Explorer (crypto-explorer.fr) est édité, à titre
            personnel et non professionnel, par :
          </p>
          <p>
            <strong className="text-foreground">Adjali Abderahmane</strong>
            <br />
            Adresse : communiquée sur demande auprès de l&apos;hébergeur,
            conformément à l&apos;article 6-III de la loi n° 2004-575 du 21
            juin 2004 pour la confiance dans l&apos;économie numérique (LCEN).
            <br />
            Contact :{" "}
            <a
              href="mailto:contact@crypto-explorer.fr"
              className="text-primary hover:underline"
            >
              contact@crypto-explorer.fr
            </a>
          </p>
          <p>
            Crypto-Explorer est un projet personnel de démonstration
            (portfolio) réalisé et maintenu par un développeur unique. Il ne
            constitue pas un service financier réglementé : les données de
            marché sont fournies à titre informatif et les fonctionnalités de
            portefeuille sont une simulation, sans mouvement d&apos;argent
            réel.
          </p>
        </LegalSection>

        <LegalSection title="Directeur de la publication">
          <p>
            La direction de la publication est assurée par Adjali
            Abderahmane, éditeur du site.
          </p>
        </LegalSection>

        <LegalSection title="Hébergement">
          <p>
            Le site est hébergé par :
            <br />
            <strong className="text-foreground">Hostinger</strong>
            <br />
            Pour les coordonnées complètes de l&apos;hébergeur, se référer
            aux mentions légales publiées sur{" "}
            <span className="text-foreground">hostinger.fr</span>.
          </p>
        </LegalSection>

        <LegalSection title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des éléments du site (textes, mise en page,
            graphismes, logo, code source) est, sauf mention contraire,
            la propriété de l&apos;éditeur ou de ses partenaires et est
            protégé par le droit d&apos;auteur.
          </p>
          <p>
            Les contenus d&apos;actualités et analyses publiés dans la
            rubrique Blog sont fournis à titre informatif et ne constituent
            en aucun cas un conseil en investissement.
          </p>
          <p>
            Toute reproduction, représentation, modification ou diffusion,
            totale ou partielle, du site ou de son contenu, sans
            autorisation préalable, est interdite.
          </p>
        </LegalSection>

        <LegalSection title="Liens hypertextes">
          <p>
            Le site peut contenir des liens vers des sites tiers. Crypto-
            Explorer n&apos;exerce aucun contrôle sur ces sites et décline
            toute responsabilité quant à leur contenu ou à leur politique de
            confidentialité.
          </p>
        </LegalSection>

        <LegalSection title="Responsabilité">
          <p>
            L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude et
            la mise à jour des informations diffusées sur le site, sans
            garantie d&apos;exhaustivité. Les données de marché (prix,
            graphiques) proviennent de fournisseurs tiers et peuvent
            comporter un délai ou des inexactitudes ; elles ne sauraient
            engager la responsabilité de l&apos;éditeur.
          </p>
          <p>
            L&apos;éditeur ne pourra être tenu responsable des dommages
            directs ou indirects résultant de l&apos;accès ou de
            l&apos;utilisation du site, y compris l&apos;indisponibilité
            temporaire du service.
          </p>
        </LegalSection>

        <LegalSection title="Droit applicable et litiges">
          <p>
            Les présentes mentions légales sont soumises au droit français.
            En cas de litige, et à défaut de résolution amiable, les
            tribunaux français compétents seront seuls saisis.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Pour toute question relative au site, écrivez à{" "}
            <a
              href="mailto:contact@crypto-explorer.fr"
              className="text-primary hover:underline"
            >
              contact@crypto-explorer.fr
            </a>{" "}
            ou utilisez le{" "}
            <Link href="/#contact" className="text-primary hover:underline">
              formulaire de contact
            </Link>{" "}
            du site.
          </p>
          <p>
            Pour la gestion de vos données personnelles et de vos cookies,
            consultez notre{" "}
            <Link
              href="/politique-de-confidentialite"
              className="text-primary hover:underline"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </LegalSection>
      </div>
    </main>
  );
}
