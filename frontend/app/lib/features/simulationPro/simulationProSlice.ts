import { createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import type { CountryRule, ProPortfolio, ProTrade } from "../../api/simulationPro";
import { logout } from "../auth/authSlice";
import { refreshSession } from "../auth/authThunks";
import {
  changeCountry,
  createPortfolio,
  fetchCountries,
  fetchPortfolio,
  fetchTrades,
  placeTrade,
  resetPortfolio,
} from "./simulationProThunks";

export interface SimulationProState {
  /** missing: logged in but no portfolio yet, so onboarding is shown. */
  status: "idle" | "loading" | "ready" | "missing" | "error";
  portfolio: ProPortfolio | null;
  error: string | null;
  countries: CountryRule[];
  trades: ProTrade[];
  tradesTotal: number;
  /** A create, reset or country change is in progress. */
  saving: boolean;
  saveError: string | null;
  trading: boolean;
  tradeError: string | null;
}

const initialState: SimulationProState = {
  status: "idle",
  portfolio: null,
  error: null,
  countries: [],
  trades: [],
  tradesTotal: 0,
  saving: false,
  saveError: null,
  trading: false,
  tradeError: null,
};

const settingsActions = [createPortfolio, changeCountry, resetPortfolio] as const;

const simulationProSlice = createSlice({
  name: "simulationPro",
  initialState,
  reducers: {
    clearTradeError(state) {
      state.tradeError = null;
    },
    clearSaveError(state) {
      state.saveError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.countries = action.payload;
      })
      .addCase(fetchPortfolio.pending, (state) => {
        // Keep showing the current portfolio while it refreshes.
        if (!state.portfolio) state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.portfolio = action.payload;
        state.status = action.payload ? "ready" : "missing";
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.status = state.portfolio ? "ready" : "error";
        state.error = action.payload?.message ?? "Erreur inattendue.";
      })
      .addCase(fetchTrades.fulfilled, (state, action) => {
        // A malformed answer leaves an empty history rather than crashing the page.
        const items = action.payload?.items;
        state.trades = Array.isArray(items) ? items : [];
        state.tradesTotal = typeof action.payload?.total === "number" ? action.payload.total : 0;
      })
      .addCase(placeTrade.pending, (state) => {
        state.trading = true;
        state.tradeError = null;
      })
      .addCase(placeTrade.fulfilled, (state) => {
        state.trading = false;
      })
      .addCase(placeTrade.rejected, (state, action) => {
        state.trading = false;
        state.tradeError = action.payload?.message ?? "L'ordre n'a pas pu être passé.";
      })
      .addCase(resetPortfolio.fulfilled, (state) => {
        state.trades = [];
        state.tradesTotal = 0;
      })
      .addMatcher(isAnyOf(...settingsActions.map((a) => a.pending)), (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addMatcher(
        isAnyOf(...settingsActions.map((a) => a.fulfilled)),
        (state, action: PayloadAction<ProPortfolio>) => {
          state.saving = false;
          state.portfolio = action.payload;
          state.status = "ready";
        },
      )
      .addMatcher(isAnyOf(...settingsActions.map((a) => a.rejected)), (state, action) => {
        state.saving = false;
        const payload = (action as { payload?: { message: string } }).payload;
        state.saveError = payload?.message ?? "L'enregistrement a échoué.";
      })
      // Another person may log in on this browser next: forget this portfolio.
      .addMatcher(isAnyOf(logout, refreshSession.rejected), () => initialState);
  },
});

export const { clearTradeError, clearSaveError } = simulationProSlice.actions;
export default simulationProSlice.reducer;
