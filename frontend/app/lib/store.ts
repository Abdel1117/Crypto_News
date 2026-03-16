import { configureStore } from "@reduxjs/toolkit";
import priceReducer from "./features/prices/pricesSlice"
import symbolsReducer from "./features/symbol/symbolSlice"
import marketViewReducer from "./features/marketView/marketViewSlice"

export const store = configureStore({
  reducer: {
    prices: priceReducer,
    symbols: symbolsReducer,
    marketView : marketViewReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
