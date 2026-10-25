import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchPrices } from "../../api/crypto";

export const getMarketHeatmap = createAsyncThunk(
  "marketHeatmap/fetch",
  async ({
    currency,
    limit,
  }: {
    currency: string;
    limit: number;
    /** Request time (ms), stored as the « mis à jour à » time on success. */
    requestedAt?: number;
  }) => {
    return await fetchPrices(currency, limit);
  },
);
