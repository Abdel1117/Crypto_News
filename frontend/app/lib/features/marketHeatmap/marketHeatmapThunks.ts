import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchPrices } from "../../api/crypto";

export const getMarketHeatmap = createAsyncThunk(
  "marketHeatmap/fetch",
  async ({ currency, limit }: { currency: string; limit: number }) => {
    return await fetchPrices(currency, limit);
  }
);
