import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgresSale from "../../app/components/ProgresSale/ProgresSale";

describe("ProgresSale", () => {
  it("computes the fill width from current/goal", () => {
    const { container } = render(
      <ProgresSale label="Accès bêta" current={50} goal={100} unit="users" />,
    );

    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.style.width).toBe("50%");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
    expect(screen.getByText("50 / 100 users")).toBeTruthy();
  });

  it("clamps the percentage to 100 when current exceeds goal", () => {
    const { container } = render(<ProgresSale label="x" current={150} goal={100} unit="u" />);
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.style.width).toBe("100%");
  });

  it("renders 0% when the goal is zero", () => {
    const { container } = render(<ProgresSale label="x" current={10} goal={0} unit="u" />);
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.style.width).toBe("0%");
  });
});
