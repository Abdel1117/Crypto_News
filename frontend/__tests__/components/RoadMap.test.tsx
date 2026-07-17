import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RoadMap from "../../app/components/RoadMap/RoadMap";

describe("RoadMap", () => {
  it("renders the four roadmap phases", () => {
    render(<RoadMap />);
    expect(screen.getAllByText("Phase 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Phase 4").length).toBeGreaterThan(0);
  });

  it("scrolls the desktop timeline when the nav buttons are clicked", () => {
    Element.prototype.scrollBy = vi.fn();
    render(<RoadMap />);

    fireEvent.click(screen.getByRole("button", { name: "Roadmap suivante" }));
    fireEvent.click(screen.getByRole("button", { name: "Roadmap précédente" }));

    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(2);
  });
});
