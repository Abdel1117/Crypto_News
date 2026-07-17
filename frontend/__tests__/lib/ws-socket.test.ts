import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  send = vi.fn();
}

describe("ws/socket", () => {
  beforeEach(() => {
    vi.resetModules();
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("connects to the configured websocket url", async () => {
    const { connect } = await import("../../app/lib/ws/socket");
    connect();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe("ws://localhost:4000/markets/ws");
  });

  it("does not open a second connection while one is open or connecting", async () => {
    const { connect } = await import("../../app/lib/ws/socket");
    connect();
    MockWebSocket.instances[0].readyState = MockWebSocket.OPEN;
    connect();

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("dispatches incoming messages to subscribed handlers on the right channel", async () => {
    const { connect, subscribe } = await import("../../app/lib/ws/socket");
    const handler = vi.fn();
    subscribe("markets", handler);
    connect();

    MockWebSocket.instances[0].onmessage?.({
      data: JSON.stringify({ channel: "markets", data: { price: 1 } }),
    });

    expect(handler).toHaveBeenCalledWith({ price: 1 });
  });

  it("ignores messages for channels with no subscribers", async () => {
    const { connect, subscribe } = await import("../../app/lib/ws/socket");
    const handler = vi.fn();
    subscribe("markets", handler);
    connect();

    MockWebSocket.instances[0].onmessage?.({
      data: JSON.stringify({ channel: "other", data: {} }),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not throw on malformed messages", async () => {
    const { connect } = await import("../../app/lib/ws/socket");
    connect();

    expect(() => {
      MockWebSocket.instances[0].onmessage?.({ data: "not-json" });
    }).not.toThrow();
  });

  it("stops calling a handler once unsubscribed", async () => {
    const { connect, subscribe } = await import("../../app/lib/ws/socket");
    const handler = vi.fn();
    const unsubscribe = subscribe("markets", handler);
    connect();
    unsubscribe();

    MockWebSocket.instances[0].onmessage?.({
      data: JSON.stringify({ channel: "markets", data: {} }),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("sends data only when the socket is open", async () => {
    const { connect, send } = await import("../../app/lib/ws/socket");
    connect();

    send({ ping: true });
    expect(MockWebSocket.instances[0].send).not.toHaveBeenCalled();

    MockWebSocket.instances[0].readyState = MockWebSocket.OPEN;
    send({ ping: true });
    expect(MockWebSocket.instances[0].send).toHaveBeenCalledWith(JSON.stringify({ ping: true }));
  });

  it("schedules a reconnect after the socket closes", async () => {
    const { connect } = await import("../../app/lib/ws/socket");
    connect();

    MockWebSocket.instances[0].readyState = MockWebSocket.CLOSED;
    MockWebSocket.instances[0].onclose?.();
    expect(MockWebSocket.instances).toHaveLength(1);

    await vi.runOnlyPendingTimersAsync();

    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("closes the socket on error, which triggers the reconnect path", async () => {
    const { connect } = await import("../../app/lib/ws/socket");
    connect();

    MockWebSocket.instances[0].onerror?.();

    expect(MockWebSocket.instances[0].closed).toBe(true);
  });

  // NOTE: this documents an actual bug in ws/socket.ts rather than the intended
  // behavior. `disconnect()` calls `ws.close()`, which (as in a real browser)
  // fires the socket's own `onclose` handler — the same handler that
  // unconditionally calls `scheduleReconnect()`. So an intentional disconnect
  // still re-arms the reconnect loop and a new socket gets created shortly
  // after. A correct fix would clear `ws.onclose` (or check an "intentional
  // disconnect" flag) before calling `ws.close()` in `disconnect()`.
  it("still re-arms a reconnect after disconnect (known bug)", async () => {
    const { connect, disconnect } = await import("../../app/lib/ws/socket");
    connect();

    disconnect();
    await vi.runOnlyPendingTimersAsync();

    expect(MockWebSocket.instances).toHaveLength(2);
  });
});
