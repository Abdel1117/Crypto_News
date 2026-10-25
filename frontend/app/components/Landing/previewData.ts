// Static, deterministic data for the dashboard preview on the landing page.
// Seeded so the server render is stable (no hydration mismatch).

export type PreviewCoin = {
  name: string;
  sym: string;
  mono: string;
  priceF: string;
  chgF: string;
  up: boolean;
  spark: string;
  sparkArea: string;
};

export type PreviewChart = {
  name: string;
  priceF: string;
  chgF: string;
  up: boolean;
  line: string;
  area: string;
  ticks: string[];
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Random walk from `start` to `end`, detrended so it lands exactly on `end`.
function series(
  seed: number,
  n: number,
  start: number,
  end: number,
  vol: number,
) {
  const r = rng(seed);
  const w = [0];
  for (let i = 1; i < n; i++) w.push(w[i - 1] + (r() - 0.5) * 2);
  const last = w[n - 1];
  return w.map(
    (v, i) =>
      start + (v - (last * i) / (n - 1)) * vol + ((end - start) * i) / (n - 1),
  );
}

function points(a: number[], W: number, H: number) {
  const lo = Math.min(...a);
  const hi = Math.max(...a);
  const rg = hi - lo || 1;
  return a
    .map(
      (v, i) =>
        ((i / (a.length - 1)) * W).toFixed(1) +
        "," +
        (2 + (H - 4) * (1 - (v - lo) / rg)).toFixed(1),
    )
    .join(" ");
}

function nf(v: number, min: number, max: number) {
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

function price(v: number) {
  if (v < 0.01)
    return v.toLocaleString("fr-FR", { maximumSignificantDigits: 2 }) + " €";
  const d = v < 1 ? 4 : 2;
  return nf(v, d, d) + " €";
}

function pct(v: number) {
  return (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v), 2, 2) + " %";
}

const FAVORITES = [
  { name: "Bitcoin", sym: "BTC", price: 72050, chg: -0.87, seed: 11 },
  { name: "Ethereum", sym: "ETH", price: 2113.54, chg: -1.98, seed: 23 },
  { name: "Solana", sym: "SOL", price: 128.4, chg: 1.82, seed: 37 },
  { name: "Dogecoin", sym: "DOGE", price: 0.0712, chg: -3.55, seed: 41 },
];

export const previewFavorites: PreviewCoin[] = FAVORITES.map((c) => {
  const s = series(
    c.seed,
    32,
    100,
    100 * (1 + c.chg / 100),
    Math.max(0.25, Math.abs(c.chg) * 0.18),
  );
  const spark = points(s, 100, 32);
  return {
    name: c.name,
    sym: c.sym,
    mono: c.sym[0],
    priceF: price(c.price),
    chgF: pct(c.chg),
    up: c.chg >= 0,
    spark,
    sparkArea: "0,32 " + spark + " 100,32",
  };
});

function buildChart(): PreviewChart {
  const n = 95;
  const open = 72680;
  const close = 72050;
  const step = 200;
  const s = series(7, n, open, close, 62);
  const lo = Math.floor((Math.min(...s) - 40) / step) * step;
  const hi = Math.ceil((Math.max(...s) + 40) / step) * step;
  const y = (v: number) => (((hi - v) / (hi - lo)) * 300).toFixed(1);
  const line = s
    .map((v, i) => ((i / (n - 1)) * 1000).toFixed(1) + "," + y(v))
    .join(" ");
  const ticks: string[] = [];
  for (let t = hi; t >= lo; t -= step)
    ticks.push((((hi - t) / (hi - lo)) * 100).toFixed(2) + "%");
  const btc = previewFavorites[0];
  return {
    name: btc.name,
    priceF: btc.priceF,
    chgF: btc.chgF,
    up: btc.up,
    line,
    area: "0,300 " + line + " 1000,300",
    ticks,
  };
}

export const previewChart = buildChart();
