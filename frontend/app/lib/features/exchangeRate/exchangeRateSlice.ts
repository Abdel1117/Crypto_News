import { createSlice } from "@reduxjs/toolkit";
import { getExchangeRate } from "./exchangeRateThunks";

interface ExchangeRateState {
  usdPerEur: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExchangeRateState = {
  usdPerEur: null,
  loading: false,
  error: null,
};

const exchangeRateSlice = createSlice({
  name: "exchangeRate",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getExchangeRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExchangeRate.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload.rate === "number") {
          state.usdPerEur = action.payload.rate;
        }
      })
      .addCase(getExchangeRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch exchange rate";
      });
  },
});

export default exchangeRateSlice.reducer;
