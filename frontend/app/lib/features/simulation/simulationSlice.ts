import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "simulation_portfolio";

export interface Trade {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  type: "buy" | "sell";
  amount: number;
  priceAtTrade: number;
  total: number;
  date: string;
}

export interface Holding {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  amount: number;
  avgBuyPrice: number;
}

export interface PortfolioSnapshot {
  date: string;
  value: number;
}

export interface SimulationState {
  balance: number;
  initialBalance: number;
  holdings: Holding[];
  trades: Trade[];
  realizedPnl: number;
  portfolioSnapshots: PortfolioSnapshot[];
}

const DEFAULT_BALANCE = 10000;

function loadState(): SimulationState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultState();
  } catch {
    return getDefaultState();
  }
}

function getDefaultState(): SimulationState {
  return {
    balance: DEFAULT_BALANCE,
    initialBalance: DEFAULT_BALANCE,
    holdings: [],
    trades: [],
    realizedPnl: 0,
    portfolioSnapshots: [{ date: new Date().toISOString(), value: DEFAULT_BALANCE }],
  };
}

function saveState(state: SimulationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const initialState: SimulationState = getDefaultState();

const simulationSlice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    initSimulation(state) {
      const saved = loadState();
      state.balance = saved.balance;
      state.initialBalance = saved.initialBalance;
      state.holdings = saved.holdings;
      state.trades = saved.trades;
      state.realizedPnl = saved.realizedPnl ?? 0;
      state.portfolioSnapshots = saved.portfolioSnapshots ?? [{ date: new Date().toISOString(), value: saved.initialBalance }];
    },
    resetSimulation(state) {
      const fresh = getDefaultState();
      state.balance = fresh.balance;
      state.initialBalance = fresh.initialBalance;
      state.holdings = fresh.holdings;
      state.trades = fresh.trades;
      state.realizedPnl = fresh.realizedPnl;
      state.portfolioSnapshots = fresh.portfolioSnapshots;
      saveState(fresh);
    },
    executeTrade(
      state,
      action: PayloadAction<{
        coinId: string;
        coinName: string;
        coinSymbol: string;
        coinImage: string;
        type: "buy" | "sell";
        amount: number;
        price: number;
      }>,
    ) {
      const { coinId, coinName, coinSymbol, coinImage, type, amount, price } =
        action.payload;
      const total = amount * price;

      if (type === "buy") {
        if (total > state.balance) return;
        state.balance -= total;

        const existing = state.holdings.find((h) => h.coinId === coinId);
        if (existing) {
          const totalCost =
            existing.avgBuyPrice * existing.amount + total;
          existing.amount += amount;
          existing.avgBuyPrice = totalCost / existing.amount;
        } else {
          state.holdings.push({
            coinId,
            coinName,
            coinSymbol,
            coinImage,
            amount,
            avgBuyPrice: price,
          });
        }
      } else {
        const existing = state.holdings.find((h) => h.coinId === coinId);
        if (!existing || existing.amount < amount) return;
        state.balance += total;
        state.realizedPnl += (price - existing.avgBuyPrice) * amount;
        existing.amount -= amount;
        if (existing.amount <= 0) {
          state.holdings = state.holdings.filter((h) => h.coinId !== coinId);
        }
      }

      state.trades.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        coinId,
        coinName,
        coinSymbol,
        coinImage,
        type,
        amount,
        priceAtTrade: price,
        total,
        date: new Date().toISOString(),
      });

      const holdingsValue = state.holdings.reduce(
        (sum, h) => sum + h.amount * (h.coinId === coinId ? price : h.avgBuyPrice),
        0,
      );
      state.portfolioSnapshots.push({
        date: new Date().toISOString(),
        value: state.balance + holdingsValue,
      });

      saveState({
        balance: state.balance,
        initialBalance: state.initialBalance,
        holdings: state.holdings,
        trades: state.trades,
        realizedPnl: state.realizedPnl,
        portfolioSnapshots: state.portfolioSnapshots,
      });
    },
  },
});

export const { initSimulation, resetSimulation, executeTrade } =
  simulationSlice.actions;
export default simulationSlice.reducer;
