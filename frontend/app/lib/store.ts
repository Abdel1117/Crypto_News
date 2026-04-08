import { configureStore } from "@reduxjs/toolkit";
import priceReducer from "./features/prices/pricesSlice"
import symbolsReducer from "./features/symbol/symbolSlice"
import marketViewReducer from "./features/marketView/marketViewSlice"
import topGainersLosersReducer from "./features/topGainersLosers/topGainersLosersSlice"
import trendingReducer from "./features/trending/trendingSlice"
import watchlistReducer from "./features/watchlist/watchlistSlice"
import simulationReducer from "./features/simulation/simulationSlice"

export const store = configureStore({
  reducer: {
    prices: priceReducer,
    symbols: symbolsReducer,
    marketView : marketViewReducer,
    topGainersLosers: topGainersLosersReducer,
    trending: trendingReducer,
    watchlist: watchlistReducer,
    simulation: simulationReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
