import { createSlice } from "@reduxjs/toolkit";
import { getMarketHeatmap } from "./marketHeatmapThunks";
import { CryptoMarketData } from "@/app/types/Crypto/Crypto";

interface MarketHeatmapState {
  coins: CryptoMarketData[];
  loading: boolean;
  error: string | null;
  /** Time (ms) of the request behind the current data. */
  updatedAt: number | null;
}

const initialState: MarketHeatmapState = {
  coins: [],
  loading: false,
  error: null,
  updatedAt: null,
};

const marketHeatmapSlice = createSlice({
  name: "marketHeatmap",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getMarketHeatmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMarketHeatmap.fulfilled, (state, action) => {
        state.loading = false;
        state.coins = action.payload;
        state.updatedAt = action.meta.arg.requestedAt ?? null;
      })
      .addCase(getMarketHeatmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch data";
      });
  },
});

export default marketHeatmapSlice.reducer;
