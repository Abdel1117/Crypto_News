import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TaxPanel from "@/app/components/SimulationPro/TaxPanel";
import StatsGrid from "@/app/components/SimulationPro/StatsGrid";
import ProSummary from "@/app/components/SimulationPro/ProSummary";
import { COUNTRIES, makePortfolio } from "../../lib/simulationProTestUtils";

const france = COUNTRIES[0];

describe("TaxPanel", () => {
  it("explains that only realized gains are taxed when nothing was sold", () => {
    render(<TaxPanel portfolio={makePortfolio()} rule={france} />);
    expect(screen.getByText(/Aucune vente pour le moment/)).toBeTruthy();
    expect(screen.getByText("Estimation")).toBeTruthy();
  });

  it("lists the tax per year, marks exempt years and links the sources", () => {
    const portfolio = makePortfolio({
      tax: {
        country: "FR",
        total: 31.4,
        fx_estimated: true,
        years: [
          { year: "2026", sales_total: 300, net_gain: 50, short_term_gain: 50, long_term_gain: 0, taxable_gain: 0, exempt: true, tax: 0 },
          { year: "2027", sales_total: 2000, net_gain: 100, short_term_gain: 100, long_term_gain: 0, taxable_gain: 100, exempt: false, tax: 31.4 },
        ],
      },
    });
    render(<TaxPanel portfolio={portfolio} rule={france} />);

    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("exonéré")).toBeTruthy();
    expect(screen.getByText(/taux de change approximatif/)).toBeTruthy();
    const link = screen.getByRole("link", { name: "impots.gouv.fr" });
    expect(link.getAttribute("href")).toBe("https://www.impots.gouv.fr/x");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getByText(/pas un conseil fiscal/)).toBeTruthy();
  });
});

describe("StatsGrid", () => {
  it("says when there isn't enough history yet", () => {
    render(<StatsGrid portfolio={makePortfolio()} />);
    expect(screen.getByText("Disponible après 2 jours d'historique.")).toBeTruthy();
    expect(screen.getAllByText("Aucune vente pour le moment.").length).toBeGreaterThan(0);
  });

  it("shows risk and trade stats", () => {
    const portfolio = makePortfolio({
      risk: { max_drawdown: 0.25, volatility: 0.6, days: 10 },
      stats: {
        trades_count: 4,
        sells_count: 2,
        win_rate: 0.5,
        best_sale: { trade_id: 2, symbol: "BTC", realized_pnl: 120, executed_at: "2026-11-02T00:00:00Z" },
        worst_sale: { trade_id: 3, symbol: "ETH", realized_pnl: -40, executed_at: "2026-11-03T00:00:00Z" },
        avg_holding_days: 3.5,
        total_fees: 12,
      },
    });
    render(<StatsGrid portfolio={portfolio} />);
    expect(screen.getByText(/^−25,0\s%$/)).toBeTruthy();
    expect(screen.getByText(/^60,0\s%$/)).toBeTruthy();
    expect(screen.getByText(/^50\s%$/)).toBeTruthy();
    expect(screen.getByText("3,5 j")).toBeTruthy();
    expect(screen.getByText("BTC")).toBeTruthy();
  });
});

describe("ProSummary", () => {
  it("shows the value, the PnL and what's left after tax", () => {
    render(<ProSummary portfolio={makePortfolio()} />);
    expect(screen.getByText(/^10\s100,00\s€$/)).toBeTruthy();
    expect(screen.getByText("Après impôt estimé")).toBeTruthy();
    expect(screen.getByText("Impôt estimé")).toBeTruthy();
  });
});

describe("ProSummary live indicator", () => {
  it("says the figures are live and when they were updated", () => {
    render(
      <ProSummary
        portfolio={makePortfolio()}
        live={{ updatedAt: "2026-11-03T14:05:30Z", delayed: false }}
      />,
    );
    expect(screen.getByText(/^En direct · mis à jour à \d{2}:\d{2}:\d{2}$/)).toBeTruthy();
  });

  it("before the first refresh, says how often it updates", () => {
    render(<ProSummary portfolio={makePortfolio()} live={{ updatedAt: null, delayed: false }} />);
    expect(screen.getByText("En direct · actualisé toutes les 30 s")).toBeTruthy();
  });

  it("says when prices are delayed", () => {
    render(
      <ProSummary
        portfolio={makePortfolio()}
        live={{ updatedAt: "2026-11-03T14:05:30Z", delayed: true }}
      />,
    );
    expect(screen.getByText(/^Prix différés · dernière mise à jour à/)).toBeTruthy();
  });

  it("has no indicator when nothing is held", () => {
    render(
      <ProSummary
        portfolio={makePortfolio({ positions: [] })}
        live={{ updatedAt: null, delayed: false }}
      />,
    );
    expect(screen.queryByText(/En direct/)).toBeNull();
  });
});
