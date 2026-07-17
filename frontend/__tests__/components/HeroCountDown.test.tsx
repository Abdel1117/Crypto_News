import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("../../app/components/CountDown/CountDown", () => ({
  CountDown: ({ target, initialNowMs }: any) => (
    <div>
      countdown target={target} initial={initialNowMs}
    </div>
  ),
}));

import { HeroCountDown } from "../../app/components/Hero/HeroCountDown";

describe("HeroCountDown", () => {
  it("sets the target ~8,000,000,000ms in the future after mount", async () => {
    render(<HeroCountDown />);

    await waitFor(() => {
      expect(screen.getByText(/target=\d+/)).toBeTruthy();
    });

    const text = screen.getByText(/target=\d+/).textContent ?? "";
    const targetMatch = text.match(/target=(\d+)/);
    const initialMatch = text.match(/initial=(\d+)/);
    expect(targetMatch).toBeTruthy();
    expect(initialMatch).toBeTruthy();

    const target = Number(targetMatch![1]);
    const initial = Number(initialMatch![1]);
    expect(target - initial).toBe(8000000000);
  });
});
