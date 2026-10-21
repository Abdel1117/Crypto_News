// Stablecoins track a peg: their 24 h "moves" are noise, so rankings and the
// heatmap leave them out (by symbol, lower case).
export const STABLECOINS = new Set([
  "usdt",
  "usdc",
  "dai",
  "busd",
  "tusd",
  "fdusd",
  "usde",
  "usds",
  "pyusd",
  "usdd",
  "frax",
  "gusd",
  "usdp",
  "lusd",
  "susd",
  "eurc",
  "eurt",
  "eurs",
  "usd1",
  "rlusd",
  "usdy",
  "usdb",
  "crvusd",
  "gho",
  "usdtb",
  "usdf",
  "usdg",
  "bfusd",
  "susde",
  "syrupusdc",
  "buidl",
]);

export const isStablecoin = (symbol: string) =>
  STABLECOINS.has(symbol.toLowerCase());
