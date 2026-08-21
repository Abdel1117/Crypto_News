import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency: vi.fn() }),
}));
vi.mock("../../../app/components/HeatMapToolTip/HeatMapToolTi", () => ({
  default: () => <div data-testid="heatmap-tooltip" />,
}));
vi.mock("@nivo/treemap", () => ({
  ResponsiveTreeMap: ({ data, onClick }: any) => (
    <div data-testid="treemap">
      {data.children.map((node: any) => (
        <button key={node.id} onClick={() => onClick({ data: node })}>
          {node.symbol}
        </button>
      ))}
    </div>
  ),
}));

import HeatMapTreemap from "../../../app/components/HeatMap/HeatMapTreemap";

const coins = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "",
    price: 50000,
    market_cap: 900000,
    change_24h: 2.5,
    volume_24h: 1000,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "",
    price: 3000,
    market_cap: 400000,
    change_24h: -1.2,
    volume_24h: 500,
  },
];

describe("HeatMapTreemap", () => {
  it("shows the error state with a retry button", () => {
    const onRefresh = vi.fn();
    render(
      <HeatMapTreemap
        coins={[]}
        loading={false}
        error="Boom"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText("Boom")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("shows a pulsing skeleton while loading", () => {
    const { container } = render(
      <HeatMapTreemap coins={[]} loading={true} error={null} onRefresh={vi.fn()} />,
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows an empty-state message when there are no coins", () => {
    render(
      <HeatMapTreemap coins={[]} loading={false} error={null} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText("Aucune donnée de marché disponible.")).toBeTruthy();
  });

  it("renders one treemap tile per coin", () => {
    render(
      <HeatMapTreemap coins={coins} loading={false} error={null} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText("BTC")).toBeTruthy();
    expect(screen.getByText("ETH")).toBeTruthy();
  });

  it("calls onSelectCrypto with the coin id when a tile is clicked", () => {
    const onSelectCrypto = vi.fn();
    render(
      <HeatMapTreemap
        coins={coins}
        loading={false}
        error={null}
        onRefresh={vi.fn()}
        onSelectCrypto={onSelectCrypto}
      />,
    );
    fireEvent.click(screen.getByText("BTC"));
    expect(onSelectCrypto).toHaveBeenCalledWith("bitcoin");
  });

  it("applies a custom height class when provided", () => {
    const { container } = render(
      <HeatMapTreemap
        coins={coins}
        loading={false}
        error={null}
        onRefresh={vi.fn()}
        heightClassName="h-[75vh] min-h-150"
      />,
    );
    expect(container.querySelector(".h-\\[75vh\\]")).toBeTruthy();
  });
});
