export type Article = {
  id: number;
  title: string;
  category: string;
  author: string;
  authorInitial: string;
  date: string;
  readTime: string;
  excerpt: string;
  gradient: string;
};

export const CATEGORY_META: Record<string, { color: string; gradient: string }> = {
  Bitcoin: {
    color: "text-yellow-400",
    gradient: "from-yellow-950 via-orange-900 to-yellow-800",
  },
  Ethereum: {
    color: "text-blue-400",
    gradient: "from-blue-950 via-blue-900 to-blue-700",
  },
  DeFi: {
    color: "text-purple-400",
    gradient: "from-purple-950 via-purple-900 to-purple-700",
  },
  NFT: {
    color: "text-pink-400",
    gradient: "from-pink-950 via-pink-900 to-pink-700",
  },
  Altcoins: {
    color: "text-teal-400",
    gradient: "from-teal-950 via-teal-900 to-teal-700",
  },
  Analyse: {
    color: "text-green-400",
    gradient: "from-green-950 via-emerald-900 to-green-700",
  },
  Réglementation: {
    color: "text-red-400",
    gradient: "from-red-950 via-red-900 to-red-700",
  },
  Web3: {
    color: "text-indigo-400",
    gradient: "from-indigo-950 via-indigo-900 to-indigo-700",
  },
};

export const ARTICLES: Article[] = [
  {
    id: 1,
    title: "Bitcoin franchit les 100 000 $ : analyse des facteurs déclencheurs",
    category: "Bitcoin",
    author: "Alice Dupont",
    authorInitial: "A",
    date: "12 juin 2025",
    readTime: "5 min",
    excerpt:
      "Pour la première fois de son histoire, le Bitcoin a franchi le seuil symbolique des 100 000 dollars, porté par un afflux massif d'investisseurs institutionnels.",
    gradient: "from-yellow-950 via-orange-900 to-yellow-800",
  },
  {
    id: 2,
    title:
      "Ethereum 3.0 : ce que la prochaine mise à jour change pour les développeurs",
    category: "Ethereum",
    author: "Marc Leblanc",
    authorInitial: "M",
    date: "10 juin 2025",
    readTime: "7 min",
    excerpt:
      "La mise à jour tant attendue promet une réduction de 80 % des frais de gas et une scalabilité inédite grâce au sharding complet.",
    gradient: "from-blue-950 via-blue-900 to-blue-700",
  },
  {
    id: 3,
    title: "DeFi : les protocoles de yield farming les plus rentables en 2025",
    category: "DeFi",
    author: "Sophie Martin",
    authorInitial: "S",
    date: "9 juin 2025",
    readTime: "6 min",
    excerpt:
      "Le secteur DeFi connaît un renouveau avec de nouveaux protocoles offrant des rendements compétitifs tout en réduisant les risques de smart contract.",
    gradient: "from-purple-950 via-purple-900 to-purple-700",
  },
  {
    id: 4,
    title:
      "NFT gaming : Axie Infinity prépare une refonte complète de son économie",
    category: "NFT",
    author: "Thomas Bernard",
    authorInitial: "T",
    date: "8 juin 2025",
    readTime: "4 min",
    excerpt:
      "Face à la chute des revenus, Sky Mavis repense entièrement le modèle économique d'Axie Infinity pour attirer une nouvelle génération de joueurs.",
    gradient: "from-pink-950 via-pink-900 to-pink-700",
  },
  {
    id: 5,
    title:
      "Solana vs Avalanche : quel réseau domine le secteur des dApps en 2025 ?",
    category: "Altcoins",
    author: "Nina Rousseau",
    authorInitial: "N",
    date: "7 juin 2025",
    readTime: "8 min",
    excerpt:
      "Les deux blockchains rivales se livrent une guerre des TPS et de l'adoption. Comparatif détaillé des performances, ecosystèmes et feuilles de route.",
    gradient: "from-teal-950 via-teal-900 to-teal-700",
  },
  {
    id: 6,
    title:
      "L'analyse technique du marché crypto : signaux haussiers pour Q3 2025",
    category: "Analyse",
    author: "Pierre Fontaine",
    authorInitial: "P",
    date: "6 juin 2025",
    readTime: "10 min",
    excerpt:
      "Chandelier japonais, RSI, volumes : notre analyste décrypte les indicateurs clés qui suggèrent un bull run prolongé pour le second semestre.",
    gradient: "from-green-950 via-emerald-900 to-green-700",
  },
  {
    id: 7,
    title:
      "MiCA en Europe : comment la nouvelle réglementation transforme le secteur",
    category: "Réglementation",
    author: "Claire Moreau",
    authorInitial: "C",
    date: "5 juin 2025",
    readTime: "9 min",
    excerpt:
      "Le règlement MiCA est pleinement en vigueur. Quelles obligations pour les exchanges, les émetteurs de stablecoins et les prestataires de services crypto ?",
    gradient: "from-red-950 via-red-900 to-red-700",
  },
  {
    id: 8,
    title: "Web3 identité décentralisée : la fin des mots de passe ?",
    category: "Web3",
    author: "Lucas Petit",
    authorInitial: "L",
    date: "4 juin 2025",
    readTime: "6 min",
    excerpt:
      "Les DID (Decentralized Identifiers) et les portefeuilles crypto pourraient remplacer login/password pour authentification universelle sur le web.",
    gradient: "from-indigo-950 via-indigo-900 to-indigo-700",
  },
  {
    id: 9,
    title: "Stablecoins algorithmiques : les leçons apprises depuis Terra Luna",
    category: "DeFi",
    author: "Sophie Martin",
    authorInitial: "S",
    date: "3 juin 2025",
    readTime: "7 min",
    excerpt:
      "Deux ans après l'effondrement de Terra, de nouveaux modèles algorithmiques tentent de prouver leur résilience. Analyse des mécanismes de stabilisation.",
    gradient: "from-purple-950 via-purple-900 to-purple-700",
  },
  {
    id: 10,
    title: "Halving Bitcoin 2024 : l'impact réel sur le cours un an après",
    category: "Bitcoin",
    author: "Alice Dupont",
    authorInitial: "A",
    date: "2 juin 2025",
    readTime: "5 min",
    excerpt:
      "Le quatrième halving avait suscité des attentes énormes. Bilan chiffré : l'effet sur le hashrate, les mineurs, et la dynamique de prix.",
    gradient: "from-yellow-950 via-orange-900 to-yellow-800",
  },
  {
    id: 11,
    title:
      "Les meilleures stratégies de DCA crypto pour les investisseurs débutants",
    category: "Analyse",
    author: "Pierre Fontaine",
    authorInitial: "P",
    date: "1 juin 2025",
    readTime: "4 min",
    excerpt:
      "Le Dollar Cost Averaging reste la méthode la plus sûre pour les novices. Guide pratique avec exemples concrets sur Bitcoin et Ethereum.",
    gradient: "from-green-950 via-emerald-900 to-green-700",
  },
  {
    id: 12,
    title: "Cardano et son écosystème DeFi : enfin prêt pour la compétition ?",
    category: "Altcoins",
    author: "Nina Rousseau",
    authorInitial: "N",
    date: "31 mai 2025",
    readTime: "6 min",
    excerpt:
      "Après des années de développement, l'écosystème DeFi de Cardano attire de vrais projets. Tour d'horizon des protocoles les plus prometteurs.",
    gradient: "from-teal-950 via-teal-900 to-teal-700",
  },
  {
    id: 13,
    title:
      "NFT musicaux : comment les artistes reprennent le contrôle de leurs droits",
    category: "NFT",
    author: "Thomas Bernard",
    authorInitial: "T",
    date: "30 mai 2025",
    readTime: "5 min",
    excerpt:
      "De Snoop Dogg à des artistes indépendants, les NFT musicaux révolutionnent la distribution et la monétisation des œuvres numériques.",
    gradient: "from-pink-950 via-pink-900 to-pink-700",
  },
  {
    id: 14,
    title: "Ethereum Layer 2 : Arbitrum, Optimism, zkSync — comparatif 2025",
    category: "Ethereum",
    author: "Marc Leblanc",
    authorInitial: "M",
    date: "29 mai 2025",
    readTime: "8 min",
    excerpt:
      "Les solutions L2 ont explosé en popularité. Frais, vitesse, sécurité, écosystème : lequel choisir selon votre usage ?",
    gradient: "from-blue-950 via-blue-900 to-blue-700",
  },
  {
    id: 15,
    title:
      "SEC vs crypto : l'état des poursuites judiciaires et leurs impacts marché",
    category: "Réglementation",
    author: "Claire Moreau",
    authorInitial: "C",
    date: "28 mai 2025",
    readTime: "7 min",
    excerpt:
      "La SEC maintient la pression sur les exchanges américains. Analyse juridique des affaires en cours et de leurs conséquences pour le secteur.",
    gradient: "from-red-950 via-red-900 to-red-700",
  },
  {
    id: 16,
    title:
      "Interopérabilité blockchain : Polkadot et Cosmos en tête de la course",
    category: "Web3",
    author: "Lucas Petit",
    authorInitial: "L",
    date: "27 mai 2025",
    readTime: "6 min",
    excerpt:
      "La communication entre blockchains est le défi majeur du Web3. Deux protocoles dominent l'espace interchain : tour d'horizon comparatif.",
    gradient: "from-indigo-950 via-indigo-900 to-indigo-700",
  },
];
