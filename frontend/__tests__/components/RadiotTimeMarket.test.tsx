import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RadiotTimeMarket from "../../app/components/RadioTimeMarket/RadiotTimeMarket";

describe("RadiotTimeMarket", () => {
  it("renders one button per option and highlights the selected one", () => {
    const onChange = vi.fn();
    render(
      <RadiotTimeMarket options={["1d", "1w", "1m"]} value="1d" onChange={onChange} />,
    );

    const oneDay = screen.getByText("1D");
    expect(oneDay.className).toContain("bg-primary");

    fireEvent.click(screen.getByText("1W"));
    expect(onChange).toHaveBeenCalledWith("1w");
  });
});
