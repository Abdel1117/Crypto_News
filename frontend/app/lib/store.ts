import { configureStore } from "@reduxjs/toolkit";
import priceReducer from "./features/prices/pricesSlice"
import symbolsReducer from "./features/symbol/symbolSlice"
import marketViewReducer from "./features/marketView/marketViewSlice"
import topGainersLosersReducer from "./features/topGainersLosers/topGainersLosersSlice"
import trendingReducer from "./features/trending/trendingSlice"
import marketHeatmapReducer from "./features/marketHeatmap/marketHeatmapSlice"
import watchlistReducer from "./features/watchlist/watchlistSlice"
import simulationReducer from "./features/simulation/simulationSlice"
import authReducer from "./features/auth/authSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    prices: priceReducer,
    symbols: symbolsReducer,
    marketView : marketViewReducer,
    topGainersLosers: topGainersLosersReducer,
    trending: trendingReducer,
    marketHeatmap: marketHeatmapReducer,
    watchlist: watchlistReducer,
    simulation: simulationReducer,
  },
  devTools: process.env.NODE_ENV !== "production"
    ? {
        name: "CryptoNews",
        trace: true,
        traceLimit: 25,
      }
    : false,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

if (process.env.NODE_ENV !== "production") {
  store.subscribe(() => {
    console.groupCollapsed("%c[Redux Store]", "color: #764abc; font-weight: bold;");
    console.log(store.getState());
    console.groupEnd();
  });
}
