import Image from "next/image";
import Link from "next/link";
import partner01 from "@/public/images/partners/01.png";
import partner02 from "@/public/images/partners/02.png";
import partner03 from "@/public/images/partners/03.png";
import partner04 from "@/public/images/partners/04.png";
import partner05 from "@/public/images/partners/05.png";
import partner06 from "@/public/images/partners/06.png";
import { getCurrentYear } from "@/app/utils/Date/DateFormater";
import CookieSettingsLink from "./CookieSettingsLink";
import {
  ArrowRightIcon,
  EnvelopeIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

const CONTACT_EMAIL = "abdel.pp@gmail.com";
const GITHUB_URL = "https://github.com/Abdel1117";
// TODO: remplacer par l'URL du profil LinkedIn.
const LINKEDIN_URL = "https://www.linkedin.com/";

const PARTNERS = [
  partner01,
  partner02,
  partner03,
  partner04,
  partner05,
  partner06,
];

export function PartnersStrip() {
  return (
    <section
      aria-label="Partenaires"
      className="grid grid-cols-3 gap-x-4 gap-y-[22px] items-center justify-items-center px-5 pt-7 pb-11 lg:flex lg:justify-between lg:gap-8 lg:px-[120px] lg:pt-10 lg:pb-[72px]"
    >
      {PARTNERS.map((src, i) => (
        <Image
          key={i}
          src={src}
          alt="Logo partenaire"
          className="h-7 lg:h-10 w-auto opacity-55"
        />
      ))}
    </section>
  );
}

type Feature = {
  title: string;
  paragraphs: string[];
  link?: { label: string; href: string };
};

const FEATURES: Feature[] = [
  {
    title: "Suivi en temps réel",
    paragraphs: [
      "Crypto-Explorer agrège les cours des principales cryptomonnaies et les présente dans un tableau de bord lisible — variations, volumes, capitalisation — accessible en quelques secondes.",
      "Ajoutez les actifs qui vous intéressent à votre watchlist personnelle et suivez leur évolution sans quitter votre espace de travail.",
    ],
    link: { label: "Accéder au dashboard", href: "/dashboard" },
  },
  {
    title: "Graphiques & analytique",
    paragraphs: [
      "Graphiques en chandeliers japonais, indicateurs de tendance et historique des prix pour affiner vos décisions.",
    ],
  },
  {
    title: "Simulation de portefeuille",
    paragraphs: [
      "La simulation de portefeuille vous permet d’acheter et de vendre des cryptomonnaies aux prix réels du marché, avec un capital virtuel. Analysez vos résultats, ajustez votre approche.",
      "Aucun compte broker, aucune mise de fonds. Juste un environnement fidèle au marché pour affiner votre stratégie avant de passer à l’acte.",
    ],
    link: { label: "Lancer la simulation", href: "/simulation" },
  },
];

export function Features() {
  return (
    <section
      id="fonctionnalites"
      className="scroll-mt-4 px-5 pt-14 pb-2 lg:px-[120px] lg:pt-[104px] lg:pb-10"
    >
      <span className="n-eyebrow">Fonctionnalités</span>
      <h2 className="mt-3.5 mb-0 text-[28px] leading-[1.15] lg:mt-4 lg:max-w-[20ch] lg:text-[44px] lg:leading-[1.1]">
        Ce que vous pouvez faire avec{" "}
        <span className="lg:whitespace-nowrap">Crypto-Explorer</span>
      </h2>
      <p className="mt-3.5 mb-0 text-[15px] leading-6 text-(--n-neutral-300) lg:mt-5 lg:max-w-[62ch] lg:text-base lg:leading-7">
        Un outil pensé pour les investisseurs autonomes — du débutant qui veut
        comprendre le marché au trader qui cherche à affiner ses stratégies sans
        friction.
      </p>

      <ol className="mt-7 lg:mt-14 flex flex-col list-none p-0">
        {FEATURES.map((f, i) => (
          <li
            key={f.title}
            className="group relative flex flex-col gap-2.5 py-[26px] lg:grid lg:grid-cols-[160px_minmax(0,380px)_minmax(0,1fr)] lg:gap-x-[72px] lg:gap-y-7 lg:items-baseline lg:py-10"
          >
            <div className="n-rule n-rule-strong lg:group-first:hidden" />
            <span className="n-tnum text-sm lg:text-[15px] text-(--n-accent)">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="m-0 text-xl lg:text-2xl leading-[1.2]">{f.title}</h3>
            <div className="flex flex-col gap-2.5 lg:gap-3.5 lg:max-w-[56ch]">
              {f.paragraphs.map((p) => (
                <p
                  key={p}
                  className="m-0 text-[15px] leading-6 lg:text-[15.5px] lg:leading-7 text-[color-mix(in_srgb,var(--n-text)_78%,transparent)]"
                >
                  {p}
                </p>
              ))}
              {f.link && (
                <Link href={f.link.href} className="n-link-arrow self-start">
                  {f.link.label}
                  <ArrowRightIcon />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const STACK = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Redux Toolkit",
  "FastAPI",
  "PostgreSQL",
  "Docker",
  "Nginx",
  "CircleCI",
];

export function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-4 relative mx-5 mt-4 pt-11 pb-12 flex flex-col gap-7 lg:mx-[120px] lg:mt-14 lg:pt-[72px] lg:pb-[88px] lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-24 lg:items-start"
    >
      <div className="n-rule" />
      <div>
        <span className="n-eyebrow">Me contacter</span>
        <h2 className="mt-3.5 mb-0 text-[28px] leading-[1.15] lg:mt-4 lg:max-w-[16ch] lg:text-[44px] lg:leading-[1.1]">
          Une question ou une collaboration ?
        </h2>
        <p className="mt-3.5 mb-0 text-[15px] leading-6 text-(--n-neutral-300) lg:mt-5 lg:max-w-[54ch] lg:text-base lg:leading-7">
          Que ce soit pour un retour sur le projet, une opportunité freelance ou
          simplement pour échanger — je lis tous les messages.
        </p>
        <div className="flex flex-col gap-2.5 mt-[22px] lg:flex-row lg:flex-wrap lg:mt-7">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="n-btn n-btn-primary n-btn-lg min-h-12 lg:min-h-0"
          >
            <EnvelopeIcon />
            {CONTACT_EMAIL}
          </a>
          <div className="grid grid-cols-2 gap-2.5 lg:flex">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="n-btn n-btn-secondary n-btn-lg min-h-12 lg:min-h-0 lg:px-4!"
            >
              <GithubLogoIcon />
              GitHub
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="n-btn n-btn-secondary n-btn-lg min-h-12 lg:min-h-0 lg:px-4!"
            >
              <LinkedinLogoIcon />
              LinkedIn
            </a>
          </div>
        </div>
        <p className="mt-3.5 mb-0 lg:mt-4 text-[13px] text-(--n-neutral-500)">
          Délai de réponse : généralement sous 48 h
        </p>
      </div>

      <div className="n-card gap-3.5 p-5 lg:gap-4 lg:p-6">
        <span className="n-kicker">Construit indépendamment</span>
        <div className="flex items-center gap-3 lg:gap-3.5">
          <span className="w-11 h-11 lg:w-12 lg:h-12 flex-none rounded-full grid place-items-center text-lg lg:text-xl font-medium bg-(--n-accent-800) text-(--n-accent-100)">
            A
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[17px] lg:text-lg font-medium">Abdel</span>
            <span className="text-[11px] lg:text-xs tracking-[0.08em] uppercase text-(--n-accent-300)">
              Full Stack Developer
            </span>
          </span>
        </div>
        <p className="m-0 text-sm leading-[1.6] text-(--n-neutral-300)">
          Crypto-Explorer est un projet personnel conçu et développé en solo —
          de l’architecture backend à l’interface utilisateur.
        </p>
        <ul
          className="flex flex-wrap gap-1.5 list-none m-0 p-0"
          aria-label="Stack technique"
        >
          {STACK.map((s) => (
            <li key={s} className="n-tag n-tag-neutral">
              {s}
            </li>
          ))}
        </ul>
        <span className="n-tag n-tag-outline self-start">
          Ouvert aux collaborations
        </span>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative mx-5 pt-5 pb-7 flex flex-col-reverse gap-2.5 text-xs text-(--n-neutral-500) lg:mx-[120px] lg:pt-6 lg:pb-8 lg:flex-row lg:items-center lg:gap-6 lg:text-[13px]">
      <div className="n-rule" />
      <span className="lg:mr-auto">
        © {getCurrentYear()} Crypto-Explorer · Développé par Adjali Abderahmane
      </span>
      <nav className="flex gap-[18px] lg:gap-6" aria-label="Liens légaux">
        <Link
          href="/mentions-legales"
          className="inline-flex items-center min-h-11 lg:min-h-0 no-underline text-(--n-neutral-400)! hover:text-(--n-accent)!"
        >
          Mentions légales
        </Link>
        <Link
          href="/politique-de-confidentialite"
          className="inline-flex items-center min-h-11 lg:min-h-0 no-underline text-(--n-neutral-400)! hover:text-(--n-accent)!"
        >
          Politique de confidentialité
        </Link>
        <CookieSettingsLink className="inline-flex items-center min-h-11 lg:min-h-0 text-(--n-neutral-400) hover:text-(--n-accent)" />
      </nav>
    </footer>
  );
}
