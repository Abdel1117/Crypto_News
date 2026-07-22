import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import InfoCard from "../../app/ui/InfoCard/InfoCard";

describe("InfoCard", () => {
  it("shows the formatted price with the default label", () => {
    render(<InfoCard value={1234.5} symbol="€" />);

    expect(screen.getByText("Solde disponible")).toBeTruthy();
    expect(screen.getByText("1.234,50€")).toBeTruthy();
  });

  it("shows a custom label", () => {
    render(<InfoCard value={10} symbol="$" label="Valeur totale" />);
    expect(screen.getByText("Valeur totale")).toBeTruthy();
  });

  it("shows a loading state instead of the price", () => {
    render(<InfoCard value={10} symbol="$" loading />);
    expect(screen.getByText("Chargement...")).toBeTruthy();
  });
});
