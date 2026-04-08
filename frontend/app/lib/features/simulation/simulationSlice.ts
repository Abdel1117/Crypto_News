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

export interface SimulationState {
  balance: number;
  initialBalance: number;
  holdings: Holding[];
  trades: Trade[];
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
    },
    resetSimulation(state) {
      const fresh = getDefaultState();
      state.balance = fresh.balance;
      state.initialBalance = fresh.initialBalance;
      state.holdings = fresh.holdings;
      state.trades = fresh.trades;
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

      saveState({
        balance: state.balance,
        initialBalance: state.initialBalance,
        holdings: state.holdings,
        trades: state.trades,
      });
    },
  },
});

export const { initSimulation, resetSimulation, executeTrade } =
  simulationSlice.actions;
export default simulationSlice.reducer;
