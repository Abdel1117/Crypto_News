import { createAsyncThunk } from "@reduxjs/toolkit"
import { fetchPrices, fetchMarketCoin } from "../../api/crypto"

export const getPrices = createAsyncThunk(
  "prices/getPrices",
  async (currency : string) => {
    return await fetchPrices(currency)
  }
)

export const getMarketCoin = createAsyncThunk(
  "prices/getMarketCoin",
  async ({ currency, cryptoId }: { currency: string; cryptoId: string }) => {
    const data = await fetchMarketCoin(currency, cryptoId)
    return data
  }
)
