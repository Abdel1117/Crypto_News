import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const useConsentMock = vi.fn();
vi.mock("../../app/context/Consent/ConsentContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../app/context/Consent/ConsentContext")>();
  return {
    ...actual,
    useConsent: () => useConsentMock(),
  };
});

import ConsentPreferencesPanel from "../../app/components/ConsentPreferencesPanel/ConsentPreferencesPanel";

function baseConsent(overrides: Record<string, unknown> = {}) {
  return {
    preferences: { necessary: true, analytics: false, marketing: false },
    consentedAt: null,
    needsConsent: true,
    isPreferencesPanelOpen: true,
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    savePreferences: vi.fn(),
    openPreferencesPanel: vi.fn(),
    closePreferencesPanel: vi.fn(),
    ...overrides,
  };
}

describe("ConsentPreferencesPanel", () => {
  beforeEach(() => {
    useConsentMock.mockReset();
  });

  it("shows the necessary category locked as always active", () => {
    useConsentMock.mockReturnValue(baseConsent());
    render(<ConsentPreferencesPanel />);

    expect(screen.getByText("Strictement nécessaires")).toBeTruthy();
    expect(screen.getAllByText("Toujours actif")).toHaveLength(1);
    expect(
      screen.getByRole("switch", { name: "Strictement nécessaires (toujours actif)" }),
    ).toHaveProperty("disabled", true);
  });

  it("starts each optional category from the current preferences", () => {
    useConsentMock.mockReturnValue(
      baseConsent({ preferences: { necessary: true, analytics: true, marketing: false } }),
    );
    render(<ConsentPreferencesPanel />);

    expect(
      screen.getByRole("switch", { name: "Mesure d'audience" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByRole("switch", { name: "Marketing et publicité" }).getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("toggles a category locally without saving until confirmed", () => {
    useConsentMock.mockReturnValue(baseConsent());
    render(<ConsentPreferencesPanel />);

    fireEvent.click(screen.getByRole("switch", { name: "Mesure d'audience" }));

    expect(
      screen.getByRole("switch", { name: "Mesure d'audience" }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("saves the toggled draft when 'Enregistrer mes choix' is clicked", () => {
    const consent = baseConsent();
    useConsentMock.mockReturnValue(consent);
    render(<ConsentPreferencesPanel />);

    fireEvent.click(screen.getByRole("switch", { name: "Mesure d'audience" }));
    fireEvent.click(screen.getByText("Enregistrer mes choix"));

    expect(consent.savePreferences).toHaveBeenCalledWith({ analytics: true, marketing: false });
  });

  it("calls closePreferencesPanel when the close button is clicked", () => {
    const consent = baseConsent();
    useConsentMock.mockReturnValue(consent);
    render(<ConsentPreferencesPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(consent.closePreferencesPanel).toHaveBeenCalledTimes(1);
  });
});
