import { createAsyncThunk } from "@reduxjs/toolkit"
import { fetchPrices } from "../../api/crypto"

export const getPrices = createAsyncThunk(
  "prices/getPrices",
  async (currency : string) => {
    try {
      console.log(currency)
        const data = await fetchPrices(currency)
  
        return data
    }
    catch(e) {
        return e
    }
  }
)