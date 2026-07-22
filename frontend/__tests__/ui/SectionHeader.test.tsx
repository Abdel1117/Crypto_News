import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { SectionHeader } from "../../app/ui/SectionHeader/SectionHeader";

describe("SectionHeader", () => {
  it("renders the title without a link when href is omitted", () => {
    render(<SectionHeader title="Tendances" />);

    expect(screen.getByText("Tendances")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a 'Voir tout' link when href is provided", () => {
    render(<SectionHeader title="Tendances" href="/trending" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/trending");
  });
});
