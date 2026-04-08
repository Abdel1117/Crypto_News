import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "watchlist";

function loadWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

interface WatchlistState {
  ids: string[];
}

const initialState: WatchlistState = {
  ids: [],
};

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    initWatchlist(state) {
      state.ids = loadWatchlist();
    },
    toggleWatchlist(state, action: PayloadAction<string>) {
      const id = action.payload;
      const index = state.ids.indexOf(id);
      if (index >= 0) {
        state.ids.splice(index, 1);
      } else {
        state.ids.push(id);
      }
      saveWatchlist(state.ids);
    },
  },
});

export const { initWatchlist, toggleWatchlist } = watchlistSlice.actions;
export default watchlistSlice.reducer;
