import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const usePathnameMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

import TopLoader from "../../app/components/TopLoader/TopLoader";

describe("TopLoader", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/dashboard");
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("renders nothing on the initial route", () => {
    const { container } = render(<TopLoader />);
    expect(container.querySelector(".top-loader")).toBeNull();
  });

  it("shows a loading bar, then done, then disappears on route change", async () => {
    const { rerender, container } = render(<TopLoader />);

    usePathnameMock.mockReturnValue("/settings");
    rerender(<TopLoader />);

    await waitFor(() => {
      expect(container.querySelector('[data-state="loading"]')).toBeTruthy();
    });

    await waitFor(
      () => {
        expect(container.querySelector('[data-state="done"]')).toBeTruthy();
      },
      { timeout: 1000 },
    );

    await waitFor(
      () => {
        expect(container.querySelector(".top-loader")).toBeNull();
      },
      { timeout: 1000 },
    );
  });
});
