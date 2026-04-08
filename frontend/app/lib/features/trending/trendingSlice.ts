import { createSlice } from "@reduxjs/toolkit";
import { getTrending } from "./trendingThunks";

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  image: string;
  price_btc: number;
  score: number;
  price: number;
  price_change_24h: number | null;
  market_cap: string;
  total_volume: string;
  sparkline: string;
}

interface TrendingState {
  coins: TrendingCoin[];
  loading: boolean;
  error: string | null;
}

const initialState: TrendingState = {
  coins: [],
  loading: false,
  error: null,
};

const trendingSlice = createSlice({
  name: "trending",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTrending.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTrending.fulfilled, (state, action) => {
        state.loading = false;
        state.coins = action.payload;
      })
      .addCase(getTrending.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch trending";
      });
  },
});

export default trendingSlice.reducer;
