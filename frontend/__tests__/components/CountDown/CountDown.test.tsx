import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountDown } from "../../../app/components/CountDown/CountDown";

describe("CountDown", () => {
  it("renders the default units with zero-padded values", () => {
    const target = new Date("2030-01-02T03:04:05.000Z").getTime();
    const initialNowMs = new Date("2030-01-01T00:00:00.000Z").getTime();

    render(<CountDown target={target} initialNowMs={initialNowMs} nowProvider={() => initialNowMs} />);

    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("03")).toBeTruthy();
    expect(screen.getByText("04")).toBeTruthy();
    expect(screen.getByText("05")).toBeTruthy();
    expect(screen.getByText("Days")).toBeTruthy();
  });

  it("renders only the requested units with custom labels", () => {
    const target = new Date("2030-01-02T03:04:05.000Z").getTime();
    const initialNowMs = new Date("2030-01-01T00:00:00.000Z").getTime();

    render(
      <CountDown
        target={target}
        initialNowMs={initialNowMs}
        nowProvider={() => initialNowMs}
        units={["hours", "minutes"]}
        labels={{ hours: "H", minutes: "M" }}
      />,
    );

    expect(screen.getByText("H")).toBeTruthy();
    expect(screen.getByText("M")).toBeTruthy();
    expect(screen.queryByText("Days")).toBeNull();
  });

  it("renders separators between units when enabled", () => {
    const target = new Date("2030-01-02T03:04:05.000Z").getTime();
    const initialNowMs = new Date("2030-01-01T00:00:00.000Z").getTime();

    const { container } = render(
      <CountDown
        target={target}
        initialNowMs={initialNowMs}
        nowProvider={() => initialNowMs}
        units={["hours", "minutes"]}
        showSeparators
      />,
    );

    expect(container.textContent).toContain(":");
  });
});
