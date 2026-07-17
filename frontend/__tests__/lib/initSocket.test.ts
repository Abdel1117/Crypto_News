import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../app/lib/store", () => ({
  store: { dispatch: vi.fn() },
}));
vi.mock("../../app/lib/ws/socket", () => ({
  connect: vi.fn(),
  subscribe: vi.fn(),
}));
vi.mock("../../app/lib/ws/channels", () => ({
  registerMarketsChannel: vi.fn(() => "handler"),
}));
vi.mock("../../app/lib/features/prices/pricesSlice", () => ({
  setLoading: vi.fn((v: boolean) => ({ type: "prices/setLoading", payload: v })),
}));

describe("initSocket", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("dispatches loading, subscribes the markets channel and connects", async () => {
    const { store } = await import("../../app/lib/store");
    const { connect, subscribe } = await import("../../app/lib/ws/socket");
    const { registerMarketsChannel } = await import("../../app/lib/ws/channels");
    const { initSocket } = await import("../../app/lib/initSocket");

    initSocket();

    expect(store.dispatch).toHaveBeenCalledWith({ type: "prices/setLoading", payload: true });
    expect(registerMarketsChannel).toHaveBeenCalledWith(store.dispatch);
    expect(subscribe).toHaveBeenCalledWith("markets", "handler");
    expect(connect).toHaveBeenCalled();
  });

  it("is a no-op on subsequent calls", async () => {
    const { connect } = await import("../../app/lib/ws/socket");
    const { initSocket } = await import("../../app/lib/initSocket");

    initSocket();
    initSocket();

    expect(connect).toHaveBeenCalledTimes(1);
  });
});
