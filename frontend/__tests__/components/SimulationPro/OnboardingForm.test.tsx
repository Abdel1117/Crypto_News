import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OnboardingForm from "@/app/components/SimulationPro/OnboardingForm";
import { COUNTRIES } from "../../lib/simulationProTestUtils";

function renderForm(onSubmit = vi.fn(), props: Partial<Parameters<typeof OnboardingForm>[0]> = {}) {
  render(
    <OnboardingForm countries={COUNTRIES} mode="create" saving={false} error={null} onSubmit={onSubmit} {...props} />,
  );
  return onSubmit;
}

const capitalInput = () => screen.getByRole("textbox", { name: "Capital de départ" });
const submitButton = () => screen.getByRole("button", { name: "Commencer la simulation" }) as HTMLButtonElement;

describe("OnboardingForm", () => {
  it("starts at 10 000 € in France", () => {
    renderForm();
    expect((capitalInput() as HTMLInputElement).value).toBe("10000");
    expect((screen.getByRole("combobox", { name: "Pays de résidence" }) as HTMLSelectElement).value).toBe("FR");
    expect(screen.getByRole("button", { name: "Euro (€)" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Flat tax de 31,4 %.")).toBeTruthy();
  });

  it.each(["999", "50001", "abc", "1000,555"])("refuses %s as capital", (value) => {
    renderForm();
    fireEvent.change(capitalInput(), { target: { value } });
    expect(submitButton().disabled).toBe(true);
    expect(capitalInput().getAttribute("aria-invalid")).toBe("true");
  });

  it.each([
    ["1000", 1000],
    ["50000", 50000],
    ["12 345,50", 12345.5],
  ])("accepts %s", (value, expected) => {
    const onSubmit = renderForm();
    fireEvent.change(capitalInput(), { target: { value } });
    fireEvent.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith({ initial_capital: expected, currency: "eur", country: "FR" });
  });

  it("presets the dollar for the United States, and lets it change", () => {
    const onSubmit = renderForm();
    fireEvent.change(screen.getByRole("combobox", { name: "Pays de résidence" }), { target: { value: "US" } });
    expect(screen.getByRole("button", { name: "Dollar ($)" }).getAttribute("aria-pressed")).toBe("true");

    // French formatting separates thousands with a narrow non-breaking space.
    fireEvent.click(screen.getByRole("button", { name: /^25\s000\s\$$/ }));
    fireEvent.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith({ initial_capital: 25000, currency: "usd", country: "US" });
  });

  it("shows the server error and the saving state", () => {
    renderForm(vi.fn(), { saving: true, error: "Tu as déjà un portefeuille de simulation." });
    expect(screen.getByRole("alert").textContent).toBe("Tu as déjà un portefeuille de simulation.");
    expect((screen.getByRole("button", { name: "Enregistrement…" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("uses the current settings when restarting", () => {
    const onSubmit = renderForm(vi.fn(), {
      mode: "reset",
      initial: { initial_capital: 5000, currency: "usd", country: "US" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Recommencer avec ces paramètres" }));
    expect(onSubmit).toHaveBeenCalledWith({ initial_capital: 5000, currency: "usd", country: "US" });
  });
});
