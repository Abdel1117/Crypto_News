import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchExchangeRate } from "../../api/crypto";

export const getExchangeRate = createAsyncThunk(
  "exchangeRate/fetch",
  async () => {
    const data = await fetchExchangeRate("eur", "usd");
    return data;
  }
);
