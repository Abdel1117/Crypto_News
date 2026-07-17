import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WithdrawalForm from "../../../app/components/Simulation/WithdrawalForm";

describe("WithdrawalForm", () => {
  it("disables the submit button when no amount is entered", () => {
    render(<WithdrawalForm />);
    expect((screen.getByText("Retirer") as HTMLButtonElement).disabled).toBe(true);
  });

  it("computes fees and net amount based on the selected country", () => {
    render(<WithdrawalForm />);

    fireEvent.change(screen.getByLabelText("Montant à retirer"), { target: { value: "1000" } });

    expect(screen.getByText("Frais de retrait (1.5%) :")).toBeTruthy();
    expect(screen.getByText("15.00")).toBeTruthy();
    expect(screen.getByText("985.00")).toBeTruthy();
    expect((screen.getByText("Retirer") as HTMLButtonElement).disabled).toBe(false);
  });

  it("recomputes fees when the country changes", () => {
    render(<WithdrawalForm />);

    fireEvent.change(screen.getByLabelText("Pays"), { target: { value: "USA" } });
    fireEvent.change(screen.getByLabelText("Montant à retirer"), { target: { value: "1000" } });

    expect(screen.getByText("Frais de retrait (1.0%) :")).toBeTruthy();
    expect(screen.getByText("10.00")).toBeTruthy();
  });
});
