import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchTopWinnersLosers } from "../../api/crypto";

export const getTopGainersLosers = createAsyncThunk(
  "topGainersLosers/fetch",
  async (currency: string) => {
    const data = await fetchTopWinnersLosers(currency);
    return data;
  }
);
