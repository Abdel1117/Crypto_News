import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/app/lib/hooks", () => ({ useAppSelector: vi.fn() }));

const setTheme = vi.fn();
const setCurrency = vi.fn();
const openPreferencesPanel = vi.fn();
vi.mock("@/app/context/Theme/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark", setTheme, toggleTheme: vi.fn() }),
}));
vi.mock("@/app/context/Curency/CurrencyContext", () => ({
  useCurrency: () => ({ currency: "eur", setCurrency }),
}));
vi.mock("@/app/context/Consent/ConsentContext", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/app/context/Consent/ConsentContext")
    >();
  return { ...actual, useConsent: vi.fn() };
});

import { useAppSelector } from "@/app/lib/hooks";
import { useConsent } from "@/app/context/Consent/ConsentContext";
import SettingsPage, { metadata } from "../../../app/(app)/settings/page";

function setAuth(isAuthenticated: boolean, initializing = false) {
  vi.mocked(useAppSelector).mockImplementation((selector) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({ auth: { isAuthenticated, initializing } } as any),
  );
}

function setConsent(consentedAt: string | null, analytics = false) {
  vi.mocked(useConsent).mockReturnValue({
    preferences: { necessary: true, analytics, marketing: false },
    consentedAt,
    openPreferencesPanel,
  } as unknown as ReturnType<typeof useConsent>);
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth(true);
    setConsent("2026-10-21T10:00:00.000Z", true);
  });

  it("is titled « Paramètres » and kept out of search engines", () => {
    expect(metadata.title).toBe("Paramètres");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("lists the appearance, currency and cookie settings", () => {
    render(<SettingsPage />);
    for (const title of ["Apparence", "Devise", "Cookies"]) {
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    }
    expect(screen.queryByText("Settings")).toBeNull();
  });

  it("switches the theme", () => {
    render(<SettingsPage />);
    expect(
      screen
        .getByRole("button", { name: "Sombre" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Clair" }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("switches the display currency", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "USD · Dollar" }));
    expect(setCurrency).toHaveBeenCalledWith("usd");
  });

  it("summarises the cookie choices and opens the preferences", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Accepté")).toBeTruthy();
    expect(screen.getByText("Refusé")).toBeTruthy();
    expect(
      screen.getByText(/Choix enregistré le 21 octobre 2026/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Gérer mes préférences" }),
    );
    expect(openPreferencesPanel).toHaveBeenCalled();
  });

  it("says when no cookie choice was made yet", () => {
    setConsent(null);
    render(<SettingsPage />);
    expect(
      screen.getByText("Aucun choix enregistré pour le moment."),
    ).toBeTruthy();
  });

  it("sends signed-out visitors to /login", () => {
    setAuth(false);
    render(<SettingsPage />);
    expect(screen.queryByRole("heading", { name: "Apparence" })).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
