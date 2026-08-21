import { createSlice } from "@reduxjs/toolkit";
import { getMarketHeatmap } from "./marketHeatmapThunks";
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard";

interface MarketHeatmapState {
  coins: CryptoMarketData[];
  loading: boolean;
  error: string | null;
}

const initialState: MarketHeatmapState = {
  coins: [],
  loading: false,
  error: null,
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
      })
      .addCase(getMarketHeatmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch data";
      });
  },
});

export default marketHeatmapSlice.reducer;
