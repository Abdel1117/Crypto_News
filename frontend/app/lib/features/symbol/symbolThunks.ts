import { createAsyncThunk } from "@reduxjs/toolkit"
 import { fetchSymbols } from "../../api/crypto"

// Placeholder async thunk for fetching symbols (adjust as needed)
export const getSymbols = createAsyncThunk(
  "symbols/getSymbols",
  async (currency : string ) => {
    try {
       const data = await fetchSymbols(currency)
       return data
    } catch (e) {
      return e
    }
  }
)
