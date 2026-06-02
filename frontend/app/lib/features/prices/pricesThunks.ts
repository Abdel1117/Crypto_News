import { createAsyncThunk } from "@reduxjs/toolkit"
import { fetchPrices, fetchMarketCoin } from "../../api/crypto"

export const getPrices = createAsyncThunk(
  "prices/getPrices",
  async (currency : string) => {
    try {
      console.log(currency)
      const data = await fetchPrices(currency)
      return data
    } catch (e) {
      return e
    }
  }
)

export const getMarketCoin = createAsyncThunk(
  "prices/getMarketCoin",
  async ({ currency, cryptoId }: { currency: string; cryptoId: string }) => {
    const data = await fetchMarketCoin(currency, cryptoId)
    return data
  }
)
