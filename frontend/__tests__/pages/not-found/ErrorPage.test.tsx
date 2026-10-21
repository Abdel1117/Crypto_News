import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "../../../app/error";

describe("Error page", () => {
  it("explains the error and lets the user retry or go home", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<ErrorPage error={new Error("boom")} reset={reset} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Une erreur est survenue",
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(reset).toHaveBeenCalled();
    expect(
      screen
        .getByRole("link", { name: "Retour à l’accueil" })
        .getAttribute("href"),
    ).toBe("/");
    expect(console.error).toHaveBeenCalled();
  });
});
