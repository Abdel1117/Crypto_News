import { describe, expect, it } from "vitest";
import { tradesToCsv } from "@/app/components/Simulation/tradesCsv";

const trades = [
  {
    id: "1",
    coinId: "bitcoin",
    coinName: "Bitcoin",
    coinSymbol: "btc",
    coinImage: "",
    type: "buy" as const,
    amount: 0.186,
    priceAtTrade: 53568,
    total: 9963.648,
    date: "2026-06-25T01:11:00.000Z",
  },
  {
    id: "2",
    coinId: "x",
    coinName: 'Coin "spécial"; test',
    coinSymbol: "x",
    coinImage: "",
    type: "sell" as const,
    amount: 1,
    priceAtTrade: 2,
    total: 2,
    date: "2026-06-26T00:00:00.000Z",
  },
];

describe("tradesToCsv", () => {
  it("writes a French CSV in the display currency", () => {
    const lines = tradesToCsv(trades, "usd", 2).split("\n");
    expect(lines[0]).toBe(
      "Date;Type;Actif;Symbole;Quantité;Prix (USD);Total (USD)",
    );
    expect(lines[1]).toBe(
      "2026-06-25T01:11:00.000Z;Achat;Bitcoin;BTC;0,186000;107136,000000;19927,30",
    );
  });

  it("quotes cells containing separators or quotes", () => {
    const line = tradesToCsv(trades, "eur", 1).split("\n")[2];
    expect(line).toContain('"Coin ""spécial""; test"');
    expect(line).toContain(";Vente;");
  });
});
