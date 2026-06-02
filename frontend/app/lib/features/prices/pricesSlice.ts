import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getPrices, getMarketCoin } from "./pricesThunks"
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
    setCoins(state, action: PayloadAction<CryptoMarketData[]>) {
      state.coins = action.payload
      state.loading = false
    },
    addOrUpdateCoin(state, action: PayloadAction<CryptoMarketData>) {
      const index = state.coins.findIndex((coin) => coin.id === action.payload.id)
      if (index >= 0) {
        state.coins[index] = action.payload
      } else {
        state.coins.push(action.payload)
      }
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
      .addCase(getMarketCoin.fulfilled, (state, action) => {
        if (
          action.payload &&
          typeof action.payload === "object" &&
          typeof (action.payload as CryptoMarketData).id === "string"
        ) {
          const coin = action.payload as CryptoMarketData
          const index = state.coins.findIndex((existing) => existing.id === coin.id)
          if (index >= 0) {
            state.coins[index] = coin
          } else {
            state.coins.push(coin)
          }
        }
      })
  }
})

export const { setCoins, setLoading, setConnected } = priceSlice.actions
export default priceSlice.reducer