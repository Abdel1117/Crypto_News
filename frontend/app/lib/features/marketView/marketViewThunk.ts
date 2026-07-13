import { createAsyncThunk } from "@reduxjs/toolkit"
import { callOhlc } from "../../api/crypto"
import { MarketViewState } from "./marketViewSlice"

export const fetchOhlcData = createAsyncThunk(
  "prices/getOhlc",
  async ({
    currency,
    selectedTimeFrame,
    cryptoId,
  }: {
    currency: string;
    selectedTimeFrame: MarketViewState["selectedTimeFrame"];
    cryptoId: string;
  }) => {
    try {
      const data = await callOhlc(currency, selectedTimeFrame, cryptoId);
      return data;
    } catch (e) {
      return e;
    }
  }
);