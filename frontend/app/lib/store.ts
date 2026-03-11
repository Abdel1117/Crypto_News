import { configureStore } from "@reduxjs/toolkit";
import priceReducer from "./features/prices/pricesSlice"

export const store = configureStore({
  reducer: {
    prices: priceReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
