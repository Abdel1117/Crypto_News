import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountDown } from "../../../app/components/CountDown/useCountDown";

describe("useCountDown", () => {
  it("computes the remaining time parts from the initial now", () => {
    const target = new Date("2030-01-02T03:04:05.000Z").getTime();
    const initialNowMs = new Date("2030-01-01T00:00:00.000Z").getTime();
    // A mount effect immediately re-applies the "real" now via nowProvider
    // (Date.now() by default) to avoid an SSR/client flash; pin it to the
    // same value as initialNowMs so it doesn't override our fixture time.
    const nowProvider = () => initialNowMs;

    const { result } = renderHook(() =>
      useCountDown({ target, clampToZero: true, initialNowMs, nowProvider }),
    );

    expect(result.current.parts).toEqual({ days: 1, hours: 3, minutes: 4, seconds: 5 });
    expect(result.current.isComplete).toBe(false);
  });

  it("marks the countdown complete and calls onComplete once the target is reached", () => {
    vi.useFakeTimers();
    const target = Date.now() + 1000;
    const onComplete = vi.fn();
    const nowProvider = vi.fn(() => target);

    renderHook(() =>
      useCountDown({ target, clampToZero: true, onComplete, nowProvider, initialNowMs: target }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not call onComplete again on subsequent renders once already complete", () => {
    vi.useFakeTimers();
    const target = Date.now();
    const onComplete = vi.fn();
    const nowProvider = vi.fn(() => target);

    const { rerender } = renderHook(
      ({ cb }) =>
        useCountDown({ target, clampToZero: true, onComplete: cb, nowProvider, initialNowMs: target }),
      { initialProps: { cb: onComplete } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ cb: onComplete });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  // NOTE: this documents actual (buggy) behavior. For an invalid target,
  // diffMs is NaN, and `NaN < 0` is false, so getCountDownParts' clamp-to-zero
  // branch never triggers — every part comes back NaN instead of 0, which
  // would render as "NaN" in the UI despite clampToZero being true.
  it("returns NaN parts for an invalid target instead of clamping to zero (known bug)", () => {
    const { result } = renderHook(() =>
      useCountDown({ target: "not-a-date", clampToZero: true }),
    );

    expect(Number.isNaN(result.current.parts.days)).toBe(true);
    expect(Number.isNaN(result.current.parts.hours)).toBe(true);
    expect(Number.isNaN(result.current.parts.minutes)).toBe(true);
    expect(Number.isNaN(result.current.parts.seconds)).toBe(true);
  });
});
