import { describe, expect, it, vi } from "vitest";
import { registerMarketsChannel } from "../../app/lib/ws/channels";

describe("registerMarketsChannel", () => {
  it("dispatches setConnected and setCoins with the received data", () => {
    const dispatch = vi.fn();
    const handler = registerMarketsChannel(dispatch as any);

    const data = [{ id: "btc" }];
    handler(data);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0][0]).toMatchObject({ payload: true });
    expect(dispatch.mock.calls[1][0]).toMatchObject({ payload: data });
  });
});
