import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CandleStickSkeleton from "../../app/ui/Skeleton/CandleStickSkeleton/CandleStickSkeleton";

describe("CandleStickSkeleton", () => {
  it("renders a status placeholder with 30 bars", () => {
    const { container } = render(<CandleStickSkeleton />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(container.querySelectorAll(".rounded-t-full").length).toBe(30);
  });
});
