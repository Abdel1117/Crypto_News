import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getPrices, getMarketCoin } from "./pricesThunks"
import { CryptoMarketData } from "@/app/types/Crypto/Crypto"



export type MarketCoinStatus = "loading" | "failed"

interface PriceState {
  coins: CryptoMarketData[]
  loading: boolean
  connected: boolean
  // Fetch status of coins loaded one by one with getMarketCoin (watchlist coins
  // outside the WS feed). No entry means loaded or never requested.
  marketCoinStatus: Record<string, MarketCoinStatus>
}

const initialState: PriceState = {
  coins: [],
  loading: false,
  connected: false,
  marketCoinStatus: {},
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
      .addCase(getMarketCoin.pending, (state, action) => {
        state.marketCoinStatus[action.meta.arg.cryptoId] = "loading"
      })
      .addCase(getMarketCoin.fulfilled, (state, action) => {
        const { cryptoId } = action.meta.arg
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
          delete state.marketCoinStatus[cryptoId]
        } else {
          state.marketCoinStatus[cryptoId] = "failed"
        }
      })
      .addCase(getMarketCoin.rejected, (state, action) => {
        state.marketCoinStatus[action.meta.arg.cryptoId] = "failed"
      })
  }
})

export const { setCoins, setLoading, setConnected } = priceSlice.actions
export default priceSlice.reducer