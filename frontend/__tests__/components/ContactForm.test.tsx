import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../app/hooks/useContactForm", () => ({
  useContactForm: vi.fn(),
}));

import { useContactForm } from "../../app/hooks/useContactForm";
import { ContactForm } from "../../app/components/ContactForm/ContactForm";

const baseHook = {
  fields: { name: "", email: "", phone: "", message: "" },
  fieldErrors: {},
  loading: false,
  sent: false,
  onChange: () => () => {},
  submit: vi.fn(),
  reset: vi.fn(),
};

describe("ContactForm", () => {
  beforeEach(() => {
    vi.mocked(useContactForm).mockReturnValue(baseHook as any);
  });

  it("renders the form fields and social icons", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/Nom complet/)).toBeTruthy();
    expect(screen.getByLabelText(/Adresse e-mail/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Facebook" })).toBeTruthy();
  });

  it("shows field errors when present", () => {
    vi.mocked(useContactForm).mockReturnValue({
      ...baseHook,
      fieldErrors: { name: "Le nom est requis." },
    } as any);

    render(<ContactForm />);
    expect(screen.getByText("Le nom est requis.")).toBeTruthy();
  });

  it("calls submit when the form is submitted", () => {
    const submit = vi.fn();
    vi.mocked(useContactForm).mockReturnValue({ ...baseHook, submit } as any);

    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));

    expect(submit).toHaveBeenCalled();
  });

  it("disables the submit button while loading", () => {
    vi.mocked(useContactForm).mockReturnValue({ ...baseHook, loading: true } as any);

    render(<ContactForm />);
    expect(screen.getByText("Envoi en cours...").closest("button")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("shows the success state and resets on demand", () => {
    const reset = vi.fn();
    vi.mocked(useContactForm).mockReturnValue({
      ...baseHook,
      sent: true,
      reset,
      fields: { ...baseHook.fields, name: "Ada", email: "ada@example.com" },
    } as any);

    render(<ContactForm />);
    expect(screen.getByText("Message envoyé !")).toBeTruthy();

    fireEvent.click(screen.getByText("Envoyer un autre message"));
    expect(reset).toHaveBeenCalled();
  });
});
