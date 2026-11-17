/**
 * Blog categories. The API accepts exactly these names
 * (backend/app/services/blog/categories.py): keep both lists in sync.
 *
 * Each category gets one OKLCH hue: covers and labels are tinted with it at
 * Nocturne's lightness/chroma, so categories differ without shouting.
 */
export const CATEGORY_META: Record<string, { hue: number }> = {
  Sécurité : {hue : 50},
  Bitcoin: { hue: 70 },
  Ethereum: { hue: 265 },
  DeFi: { hue: 300 },
  NFT: { hue: 350 },
  Altcoins: { hue: 185 },
  Analyse: { hue: 155 },
  Réglementation: { hue: 25 },
  Web3: { hue: 280 },
};

export const CATEGORIES = Object.keys(CATEGORY_META);

/** Fallback hue: the Nocturne accent. */
export const DEFAULT_HUE = 289;

export const categoryHue = (category: string) =>
  CATEGORY_META[category]?.hue ?? DEFAULT_HUE;
