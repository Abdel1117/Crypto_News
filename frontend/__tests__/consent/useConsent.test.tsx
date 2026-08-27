import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const syncAnalyticsConsentMock = vi.fn();
vi.mock("../../app/consent/analytics", () => ({
  syncAnalyticsConsent: (...args: unknown[]) => syncAnalyticsConsentMock(...args),
}));

import { ConsentProvider, useConsent } from "../../app/consent/useConsent";

const STORAGE_KEY = "consent";

function Probe() {
  const { preferences, needsConsent, consentedAt, acceptAll, rejectAll, savePreferences } =
    useConsent();
  return (
    <div>
      <span data-testid="needs-consent">{String(needsConsent)}</span>
      <span data-testid="analytics">{String(preferences.analytics)}</span>
      <span data-testid="marketing">{String(preferences.marketing)}</span>
      <span data-testid="consented-at">{consentedAt ?? ""}</span>
      <button onClick={acceptAll}>accept-all</button>
      <button onClick={rejectAll}>reject-all</button>
      <button onClick={() => savePreferences({ analytics: true, marketing: false })}>
        customize
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <ConsentProvider>
      <Probe />
    </ConsentProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  syncAnalyticsConsentMock.mockReset();
});

describe("useConsent outside a provider", () => {
  it("throws", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useConsent must be used within a ConsentProvider");
    consoleError.mockRestore();
  });
});

describe("ConsentProvider — default consent", () => {
  it("needs consent and defaults optional categories to false when nothing is stored", async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));
    expect(screen.getByTestId("analytics").textContent).toBe("false");
    expect(screen.getByTestId("marketing").textContent).toBe("false");
  });
});

describe("ConsentProvider — tout accepter", () => {
  it("grants every category and records consent", async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));

    fireEvent.click(screen.getByText("accept-all"));

    expect(screen.getByTestId("needs-consent").textContent).toBe("false");
    expect(screen.getByTestId("analytics").textContent).toBe("true");
    expect(screen.getByTestId("marketing").textContent).toBe("true");
    expect(screen.getByTestId("consented-at").textContent).not.toBe("");
  });
});

describe("ConsentProvider — tout refuser", () => {
  it("keeps only necessary cookies active", async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));

    fireEvent.click(screen.getByText("reject-all"));

    expect(screen.getByTestId("needs-consent").textContent).toBe("false");
    expect(screen.getByTestId("analytics").textContent).toBe("false");
    expect(screen.getByTestId("marketing").textContent).toBe("false");
  });
});

describe("ConsentProvider — personnalisation", () => {
  it("saves an independent choice per category", async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));

    fireEvent.click(screen.getByText("customize"));

    expect(screen.getByTestId("analytics").textContent).toBe("true");
    expect(screen.getByTestId("marketing").textContent).toBe("false");
  });
});

describe("ConsentProvider — persistence & re-read", () => {
  it("persists the accepted preferences into localStorage", async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));

    fireEvent.click(screen.getByText("accept-all"));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      expect(stored?.preferences).toEqual({ necessary: true, analytics: true, marketing: true });
    });
  });

  it("rehydrates a previously stored, current-policy consent without re-asking", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences: { necessary: true, analytics: true, marketing: false },
        consentedAt: "2026-08-25T10:00:00.000Z",
        policyVersion: "1.0.0",
      }),
    );

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("false"));
    expect(screen.getByTestId("analytics").textContent).toBe("true");
    expect(screen.getByTestId("marketing").textContent).toBe("false");
  });

  it("returns to needing consent for corrupted JSON instead of throwing", async () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));
  });

  it("returns to needing consent when a payload is missing required fields", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preferences: { necessary: true } }));

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));
  });
});

describe("ConsentProvider — policy version change", () => {
  it("re-asks for consent when the stored policyVersion is stale", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences: { necessary: true, analytics: false, marketing: false },
        consentedAt: "2026-08-25T10:00:00.000Z",
        policyVersion: "0.0.1",
      }),
    );

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));
  });
});

describe("ConsentProvider — third-party sync", () => {
  it("syncs the granted preferences once consent is recorded", async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("needs-consent").textContent).toBe("true"));

    fireEvent.click(screen.getByText("customize"));

    await waitFor(() =>
      expect(syncAnalyticsConsentMock).toHaveBeenCalledWith(
        expect.objectContaining({ analytics: true, marketing: false }),
      ),
    );
  });
});
