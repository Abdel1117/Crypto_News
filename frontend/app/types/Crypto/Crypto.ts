/** A coin as returned by the market endpoints (prices in the display currency). */
export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  market_cap: number;
  change_24h: number;
  volume_24h?: number;
}

/** A coin that may lack market data yet (e.g. a favourite still loading). */
export interface CoinSummary {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price?: number;
  market_cap?: number;
  change_24h?: number;
  volume_24h?: number;
}
