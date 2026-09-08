import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/lib/hooks", () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

vi.mock("@/app/lib/features/auth/authThunks", () => ({
  refreshSession: vi.fn(() => ({ type: "auth/refreshSession" })),
}));

import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { refreshSession } from "@/app/lib/features/auth/authThunks";
import AuthBootstrap from "../../../app/components/AuthBootstrap/AuthBootstrap";

type FakeAuthState = { isAuthenticated: boolean; expiresAt: number | null };

function mockAuthState(auth: FakeAuthState) {
  vi.mocked(useAppSelector).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: any) => selector({ auth }),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AuthBootstrap", () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
    mockAuthState({ isAuthenticated: false, expiresAt: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing", () => {
    const { container } = render(<AuthBootstrap />);
    expect(container.firstChild).toBeNull();
  });

  it("dispatches refreshSession once on mount to silently restore the session from the refresh cookie", () => {
    render(<AuthBootstrap />);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/refreshSession" });
  });

  it("does not schedule a rotation when there is no authenticated session", () => {
    render(<AuthBootstrap />);
    mockDispatch.mockClear();

    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("schedules the next rotation shortly before the access token expires", () => {
    const expiresAt = Date.now() + 30000;
    mockAuthState({ isAuthenticated: true, expiresAt });

    render(<AuthBootstrap />);
    mockDispatch.mockClear();

    // 5s safety margin before the 30s expiry → fires at ~25s, not before.
    vi.advanceTimersByTime(24999);
    expect(mockDispatch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/refreshSession" });
  });
});
