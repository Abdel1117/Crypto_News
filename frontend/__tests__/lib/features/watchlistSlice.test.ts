import { describe, expect, it, beforeEach } from "vitest";
import watchlistReducer, {
  initWatchlist,
  toggleWatchlist,
} from "../../../app/lib/features/watchlist/watchlistSlice";

describe("watchlistSlice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("has an empty initial state", () => {
    const state = watchlistReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({ ids: [] });
  });

  it("loads the persisted watchlist on init", () => {
    localStorage.setItem("watchlist", JSON.stringify(["btc", "eth"]));

    const state = watchlistReducer({ ids: [] }, initWatchlist());

    expect(state.ids).toEqual(["btc", "eth"]);
  });

  it("falls back to an empty list when storage is corrupted", () => {
    localStorage.setItem("watchlist", "not-json");

    const state = watchlistReducer({ ids: [] }, initWatchlist());

    expect(state.ids).toEqual([]);
  });

  it("adds a coin id and persists it", () => {
    const state = watchlistReducer({ ids: [] }, toggleWatchlist("btc"));

    expect(state.ids).toEqual(["btc"]);
    expect(JSON.parse(localStorage.getItem("watchlist")!)).toEqual(["btc"]);
  });

  it("removes a coin id already in the watchlist", () => {
    const state = watchlistReducer({ ids: ["btc", "eth"] }, toggleWatchlist("btc"));

    expect(state.ids).toEqual(["eth"]);
    expect(JSON.parse(localStorage.getItem("watchlist")!)).toEqual(["eth"]);
  });
});
