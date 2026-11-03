import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import {
  LIVE_REFRESH_MS,
  applyLivePrices,
  useLivePortfolio,
} from "@/app/components/SimulationPro/useLivePortfolio";
import type { ProPortfolio } from "@/app/lib/api/simulationPro";
import { jsonResponse, makePortfolio, makeProStore } from "../../lib/simulationProTestUtils";

// The fixture: 7 500 cash, 0.04 BTC bought for 2 500 (server price 65 000),
// starting capital 10 000.

let visibility: DocumentVisibilityState = "visible";
function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

function quotesResponse(prices: Record<string, number>, stale: string[] = []) {
  return jsonResponse(200, { prices, stale, at: "2026-11-03T14:05:30Z" });
}

function renderLive(portfolio: ProPortfolio | null) {
  const store = makeProStore({ status: "ready", portfolio });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook((p: ProPortfolio | null) => useLivePortfolio(p), {
    initialProps: portfolio,
    wrapper,
  });
}

async function tick(ms = LIVE_REFRESH_MS) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  visibility = "visible";
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibility,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("applyLivePrices", () => {
  it("recomputes value, PnL and after-tax PnL with the server's formulas", () => {
    const portfolio = makePortfolio({
      tax: { country: "FR", years: [], total: 50, fx_estimated: false },
    });
    const live = applyLivePrices(portfolio, { bitcoin: 70000 });

    const btc = live.positions[0];
    expect(btc.price).toBe(70000);
    expect(btc.value).toBeCloseTo(2800);
    expect(btc.pnl).toBeCloseTo(300);
    expect(btc.pnl_percent).toBeCloseTo(12);
    expect(live.holdings_value).toBeCloseTo(2800);
    expect(live.total_value).toBeCloseTo(10300); // cash + positions
    expect(live.pnl.total).toBeCloseTo(300);
    expect(live.pnl.total_percent).toBeCloseTo(3);
    expect(live.pnl.unrealized).toBeCloseTo(300);
    expect(live.pnl.after_tax).toBeCloseTo(250); // PnL − estimated tax
    expect(live.pnl.realized).toBe(portfolio.pnl.realized);
    expect(btc.share).toBeCloseTo((2800 / 10300) * 100);
  });

  it("keeps the server's price for a coin without a live price", () => {
    const live = applyLivePrices(makePortfolio(), {});
    expect(live.positions[0].price).toBe(65000);
    expect(live.total_value).toBeCloseTo(10100);
  });
});

describe("useLivePortfolio", () => {
  it("refreshes the prices every 30 seconds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(quotesResponse({ bitcoin: 70000 }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderLive(makePortfolio());

    expect(fetchMock).not.toHaveBeenCalled(); // just loaded: no immediate refresh
    expect(result.current.updatedAt).toBeNull();

    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/simulation\/quotes$/);
    expect(result.current.portfolio?.total_value).toBeCloseTo(10300);
    expect(result.current.updatedAt).toBe("2026-11-03T14:05:30Z");
    expect(result.current.delayed).toBe(false);

    fetchMock.mockResolvedValue(quotesResponse({ bitcoin: 60000 }));
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.portfolio?.total_value).toBeCloseTo(9900);
  });

  it("stops while the tab is hidden and refreshes as soon as it's back", async () => {
    const fetchMock = vi.fn().mockResolvedValue(quotesResponse({ bitcoin: 70000 }));
    vi.stubGlobal("fetch", fetchMock);
    renderLive(makePortfolio());

    act(() => setVisibility("hidden"));
    await tick(LIVE_REFRESH_MS * 3);
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      setVisibility("visible");
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("doesn't poll when nothing is held", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderLive(makePortfolio({ positions: [], holdings_value: 0 }));

    await tick(LIVE_REFRESH_MS * 2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the last figures and says they're delayed when a refresh fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(quotesResponse({ bitcoin: 70000 }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderLive(makePortfolio());
    await tick();

    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await tick();

    expect(result.current.delayed).toBe(true);
    expect(result.current.portfolio?.total_value).toBeCloseTo(10300);
  });

  it("flags coins without a live price as delayed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(quotesResponse({}, ["bitcoin"])));
    const { result } = renderLive(makePortfolio());
    await tick();
    expect(result.current.delayed).toBe(true);
  });

  it("drops live prices when the server sends a new portfolio", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(quotesResponse({ bitcoin: 70000 })));
    const { result, rerender } = renderLive(makePortfolio());
    await tick();
    expect(result.current.portfolio?.total_value).toBeCloseTo(10300);

    // After an order, the server's portfolio is the reference again.
    rerender(makePortfolio({ cash: 5000, total_value: 7600 }));
    expect(result.current.portfolio?.total_value).toBe(7600);
    expect(result.current.updatedAt).toBeNull();
  });

  it("handles no portfolio", () => {
    vi.stubGlobal("fetch", vi.fn());
    const { result } = renderLive(null);
    expect(result.current).toEqual({ portfolio: null, updatedAt: null, delayed: false });
  });
});
