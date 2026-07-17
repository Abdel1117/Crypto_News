import { describe, expect, it, beforeEach } from "vitest";
import simulationReducer, {
  initSimulation,
  resetSimulation,
  executeTrade,
} from "../../../app/lib/features/simulation/simulationSlice";

const baseState = {
  balance: 10000,
  initialBalance: 10000,
  holdings: [] as any[],
  trades: [] as any[],
  realizedPnl: 0,
  portfolioSnapshots: [{ date: "2024-01-01T00:00:00.000Z", value: 10000 }],
};

describe("simulationSlice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes from the default state when nothing is persisted", () => {
    const state = simulationReducer(baseState, initSimulation());
    expect(state.balance).toBe(10000);
    expect(state.holdings).toEqual([]);
  });

  it("loads a persisted portfolio on init", () => {
    localStorage.setItem(
      "simulation_portfolio",
      JSON.stringify({ ...baseState, balance: 500, realizedPnl: 42 }),
    );

    const state = simulationReducer(baseState, initSimulation());

    expect(state.balance).toBe(500);
    expect(state.realizedPnl).toBe(42);
  });

  it("resets the portfolio to its default values", () => {
    const dirty = { ...baseState, balance: 1, trades: [{ id: "1" } as any] };
    const state = simulationReducer(dirty, resetSimulation());

    expect(state.balance).toBe(10000);
    expect(state.trades).toEqual([]);
  });

  it("buys a new holding and deducts the balance", () => {
    const state = simulationReducer(
      baseState,
      executeTrade({
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "img.png",
        type: "buy",
        amount: 1,
        price: 100,
      }),
    );

    expect(state.balance).toBe(9900);
    expect(state.holdings).toHaveLength(1);
    expect(state.holdings[0]).toMatchObject({ coinId: "btc", amount: 1, avgBuyPrice: 100 });
    expect(state.trades).toHaveLength(1);
  });

  it("ignores a buy when the balance is insufficient", () => {
    const state = simulationReducer(
      { ...baseState, balance: 10 },
      executeTrade({
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "img.png",
        type: "buy",
        amount: 1,
        price: 100,
      }),
    );

    expect(state.balance).toBe(10);
    expect(state.holdings).toEqual([]);
  });

  it("averages the buy price when adding to an existing holding", () => {
    const withHolding = {
      ...baseState,
      holdings: [
        {
          coinId: "btc",
          coinName: "Bitcoin",
          coinSymbol: "btc",
          coinImage: "img.png",
          amount: 1,
          avgBuyPrice: 100,
        },
      ],
    };

    const state = simulationReducer(
      withHolding,
      executeTrade({
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "img.png",
        type: "buy",
        amount: 1,
        price: 200,
      }),
    );

    expect(state.holdings[0].amount).toBe(2);
    expect(state.holdings[0].avgBuyPrice).toBe(150);
  });

  it("sells a holding, realizes pnl and credits the balance", () => {
    const withHolding = {
      ...baseState,
      holdings: [
        {
          coinId: "btc",
          coinName: "Bitcoin",
          coinSymbol: "btc",
          coinImage: "img.png",
          amount: 2,
          avgBuyPrice: 100,
        },
      ],
    };

    const state = simulationReducer(
      withHolding,
      executeTrade({
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "img.png",
        type: "sell",
        amount: 1,
        price: 150,
      }),
    );

    expect(state.balance).toBe(10150);
    expect(state.realizedPnl).toBe(50);
    expect(state.holdings[0].amount).toBe(1);
  });

  it("removes the holding entirely when selling the full amount", () => {
    const withHolding = {
      ...baseState,
      holdings: [
        {
          coinId: "btc",
          coinName: "Bitcoin",
          coinSymbol: "btc",
          coinImage: "img.png",
          amount: 1,
          avgBuyPrice: 100,
        },
      ],
    };

    const state = simulationReducer(
      withHolding,
      executeTrade({
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "img.png",
        type: "sell",
        amount: 1,
        price: 150,
      }),
    );

    expect(state.holdings).toEqual([]);
  });

  it("ignores a sell when there is no matching holding", () => {
    const state = simulationReducer(
      baseState,
      executeTrade({
        coinId: "btc",
        coinName: "Bitcoin",
        coinSymbol: "btc",
        coinImage: "img.png",
        type: "sell",
        amount: 1,
        price: 150,
      }),
    );

    expect(state).toEqual(baseState);
  });
});
