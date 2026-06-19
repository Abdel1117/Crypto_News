import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...props}>
      {children}
    </a>
  ),
}));

import NotFound from "../../../app/not-found";

describe("NotFound page", () => {
  it("renders the 404 message and a back-to-home link", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeTruthy();
    expect(screen.getByText("Page non trouvée")).toBeTruthy();

    const backLink = screen.getByRole("link", { name: /retour à l'accueil/i });
    expect(backLink.getAttribute("href")).toBe("/");
  });
});
