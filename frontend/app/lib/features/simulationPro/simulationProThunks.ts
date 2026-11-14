import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "../../store";
import { ApiError } from "../../auth/authFetch";
import {
  createPortfolio as apiCreate,
  getCountries,
  getPortfolio,
  getQuotes,
  getTrades,
  placeTrade as apiPlaceTrade,
  resetPortfolio as apiReset,
  updateCountry as apiUpdateCountry,
  type CountryCode,
  type CountryRule,
  type LiveQuotes,
  type PortfolioSettings,
  type ProPortfolio,
  type ProTrade,
  type TradeOrder,
} from "../../api/simulationPro";

type ThunkConfig = {
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: { status: number; message: string };
};

const NETWORK_ERROR = "Connexion au serveur impossible. Vérifie ta connexion et réessaie.";

function toReject(err: unknown) {
  if (err instanceof ApiError) return { status: err.status, message: err.message };
  return { status: 0, message: NETWORK_ERROR };
}

export const fetchCountries = createAsyncThunk<CountryRule[], void, ThunkConfig>(
  "simulationPro/fetchCountries",
  async (_, { rejectWithValue }) => {
    try {
      return await getCountries();
    } catch (err) {
      return rejectWithValue(toReject(err));
    }
  },
);

/** Resolves to null when the user has no portfolio yet (onboarding). */
export const fetchPortfolio = createAsyncThunk<ProPortfolio | null, void, ThunkConfig>(
  "simulationPro/fetchPortfolio",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      return await getPortfolio({ dispatch, getState });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      return rejectWithValue(toReject(err));
    }
  },
);

export const fetchTrades = createAsyncThunk<
  { items: ProTrade[]; total: number },
  void,
  ThunkConfig
>("simulationPro/fetchTrades", async (_, { dispatch, getState, rejectWithValue }) => {
  try {
    return await getTrades({ dispatch, getState });
  } catch (err) {
    return rejectWithValue(toReject(err));
  }
});

export const createPortfolio = createAsyncThunk<ProPortfolio, PortfolioSettings, ThunkConfig>(
  "simulationPro/create",
  async (settings, { dispatch, getState, rejectWithValue }) => {
    try {
      return await apiCreate(settings, { dispatch, getState });
    } catch (err) {
      return rejectWithValue(toReject(err));
    }
  },
);

export const changeCountry = createAsyncThunk<ProPortfolio, CountryCode, ThunkConfig>(
  "simulationPro/changeCountry",
  async (country, { dispatch, getState, rejectWithValue }) => {
    try {
      return await apiUpdateCountry(country, { dispatch, getState });
    } catch (err) {
      return rejectWithValue(toReject(err));
    }
  },
);

export const resetPortfolio = createAsyncThunk<ProPortfolio, PortfolioSettings, ThunkConfig>(
  "simulationPro/reset",
  async (settings, { dispatch, getState, rejectWithValue }) => {
    try {
      return await apiReset(settings, { dispatch, getState });
    } catch (err) {
      return rejectWithValue(toReject(err));
    }
  },
);

/** Places the order, then reloads the portfolio and the history. */
export const placeTrade = createAsyncThunk<ProTrade, TradeOrder, ThunkConfig>(
  "simulationPro/placeTrade",
  async (order, { dispatch, getState, rejectWithValue }) => {
    try {
      const trade = await apiPlaceTrade(order, { dispatch, getState });
      await Promise.all([dispatch(fetchPortfolio()), dispatch(fetchTrades())]);
      return trade;
    } catch (err) {
      return rejectWithValue(toReject(err));
    }
  },
);

/**
 * Live prices for the real-time display. Not stored in the slice: only the
 * open page needs them (see components/SimulationPro/useLivePortfolio.ts).
 */
export const fetchQuotes = createAsyncThunk<LiveQuotes, void, ThunkConfig>(
  "simulationPro/fetchQuotes",
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      return await getQuotes({ dispatch, getState });
    } catch (err) {
      return rejectWithValue(toReject(err));
    }
  },
);
