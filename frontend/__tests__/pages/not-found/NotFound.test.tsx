import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "../../../app/not-found";

describe("NotFound", () => {
  it("renders the 404 message with links home and to the dashboard", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 1, name: "Page introuvable" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Retour à l’accueil" })
        .getAttribute("href"),
    ).toBe("/");
    expect(
      screen
        .getByRole("link", { name: "Ouvrir le dashboard" })
        .getAttribute("href"),
    ).toBe("/dashboard");
  });
});
