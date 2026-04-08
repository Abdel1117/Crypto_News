import { createSlice } from "@reduxjs/toolkit";
import { getTopGainersLosers } from "./topGainersLosersThunks";

export interface GainerLoserCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  market_cap: number;
  price_change_percentage: number;
  sparkline: number[];
}

interface TopGainersLosersState {
  topGainers: GainerLoserCoin[];
  topLosers: GainerLoserCoin[];
  loading: boolean;
  error: string | null;
}

const initialState: TopGainersLosersState = {
  topGainers: [],
  topLosers: [],
  loading: false,
  error: null,
};

const topGainersLosersSlice = createSlice({
  name: "topGainersLosers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTopGainersLosers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTopGainersLosers.fulfilled, (state, action) => {
        state.loading = false;
        state.topGainers = action.payload.top_gainers;
        state.topLosers = action.payload.top_losers;
      })
      .addCase(getTopGainersLosers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch data";
      });
  },
});

export default topGainersLosersSlice.reducer;
