import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const useConsentMock = vi.fn();
vi.mock("../../app/consent/useConsent", () => ({
  useConsent: () => useConsentMock(),
}));
vi.mock("../../app/consent/components/ConsentPreferencesPanel", () => ({
  default: () => <div data-testid="preferences-panel" />,
}));

import CookieBanner from "../../app/consent/components/CookieBanner";

function baseConsent(overrides: Partial<ReturnType<typeof useConsentMock>> = {}) {
  return {
    preferences: { necessary: true, analytics: false, marketing: false },
    consentedAt: null,
    needsConsent: true,
    isPreferencesPanelOpen: false,
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    savePreferences: vi.fn(),
    openPreferencesPanel: vi.fn(),
    closePreferencesPanel: vi.fn(),
    ...overrides,
  };
}

describe("CookieBanner", () => {
  beforeEach(() => {
    useConsentMock.mockReset();
  });

  it("shows the three required actions when consent is needed", () => {
    useConsentMock.mockReturnValue(baseConsent());
    render(<CookieBanner />);

    expect(screen.getByText("Tout accepter")).toBeTruthy();
    expect(screen.getByText("Tout refuser")).toBeTruthy();
    expect(screen.getByText("Personnaliser")).toBeTruthy();
  });

  it("calls acceptAll when 'Tout accepter' is clicked", () => {
    const consent = baseConsent();
    useConsentMock.mockReturnValue(consent);
    render(<CookieBanner />);

    fireEvent.click(screen.getByText("Tout accepter"));
    expect(consent.acceptAll).toHaveBeenCalledTimes(1);
  });

  it("calls rejectAll when 'Tout refuser' is clicked", () => {
    const consent = baseConsent();
    useConsentMock.mockReturnValue(consent);
    render(<CookieBanner />);

    fireEvent.click(screen.getByText("Tout refuser"));
    expect(consent.rejectAll).toHaveBeenCalledTimes(1);
  });

  it("opens the preferences panel when 'Personnaliser' is clicked", () => {
    const consent = baseConsent();
    useConsentMock.mockReturnValue(consent);
    render(<CookieBanner />);

    fireEvent.click(screen.getByText("Personnaliser"));
    expect(consent.openPreferencesPanel).toHaveBeenCalledTimes(1);
  });

  it("renders the preferences panel instead of the banner when it's open", () => {
    useConsentMock.mockReturnValue(baseConsent({ isPreferencesPanelOpen: true }));
    render(<CookieBanner />);

    expect(screen.getByTestId("preferences-panel")).toBeTruthy();
    expect(screen.queryByText("Tout accepter")).toBeNull();
  });

  it("renders nothing but a small reopen affordance once consent is already recorded", () => {
    const consent = baseConsent({ needsConsent: false });
    useConsentMock.mockReturnValue(consent);
    render(<CookieBanner />);

    expect(screen.queryByText("Tout accepter")).toBeNull();
    const reopenButton = screen.getByRole("button", { name: "Gérer mes préférences de cookies" });
    fireEvent.click(reopenButton);
    expect(consent.openPreferencesPanel).toHaveBeenCalledTimes(1);
  });
});
