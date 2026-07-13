import { FAQItemData } from "./types";

export const faqData: FAQItemData[] = [
  {
    id: "1",
    question: "Qu'est-ce que Crypto-Explorer ?",
    answer:
      "Crypto-Explorer est un tableau de bord crypto personnel, conçu pour suivre les marchés en temps réel, simuler des stratégies d'investissement et gérer une watchlist personnalisée, sans compte broker requis.",
  },
  {
    id: "2",
    question: "Comment fonctionne la simulation de portefeuille ?",
    answer:
      "La simulation vous permet d'acheter et de vendre des cryptomonnaies avec un solde virtuel, aux prix réels du marché. Vous pouvez tester des stratégies, observer vos performances et réinitialiser à tout moment — sans risque financier.",
  },
  {
    id: "3",
    question: "Faut-il créer un compte pour accéder au dashboard ?",
    answer:
      "Non, un compte n'est pas nécessaire pour accéder au dashboard, à la watchlist et à la simulation. Cependant l'inscription est gratuite et ne requiert aucune vérification d'identité (KYC) — un email et un mot de passe suffisent.",
  },

  {
    id: "4",
    question: "Quelles technologies sont utilisées ?",
    answer:
      "Le projet repose sur Next.js 15 (App Router), TypeScript, Redux Toolkit, PostgreSQL et Docker. L'interface utilise Tailwind CSS v4. L'ensemble est déployé en conteneurs Docker pour garantir la reproductibilité des environnements.",
  },
];
