import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getPrices } from "./pricesThunks"
import { CryptoMarketData } from "@/app/ui/CryptoInfoCard/CryptoInfoCard"



interface PriceState {
  coins: CryptoMarketData[]
  loading: boolean
  connected: boolean
}

const initialState: PriceState = {
  coins: [],
  loading: false,
  connected: false,
}

const priceSlice = createSlice({
  name: "prices",
  initialState,
  reducers: {
    setCoins(state, action: PayloadAction<CryptoMarketData[] >) {
      state.coins = action.payload
      state.loading = false
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPrices.pending, (state) => {
        state.loading = true
      })
      .addCase(getPrices.fulfilled, (state, action) => {
        state.loading = false
        state.coins = action.payload
      })
      .addCase(getPrices.rejected, (state) => {
        state.loading = false
      })
  }
})

export const { setCoins, setLoading, setConnected } = priceSlice.actions
export default priceSlice.reducer