import { describe, expect, it, vi, beforeEach } from "vitest";

const initMock = vi.fn();
vi.mock("@plausible-analytics/tracker", () => ({
  init: (...args: unknown[]) => initMock(...args),
}));

describe("syncAnalyticsConsent", () => {
  beforeEach(() => {
    vi.resetModules();
    initMock.mockReset();
    delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  });

  it("does not load the tracker when analytics is not granted", async () => {
    const { syncAnalyticsConsent } = await import("../../app/consent/analytics");
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "example.com";

    syncAnalyticsConsent({ necessary: true, analytics: false, marketing: false });

    expect(initMock).not.toHaveBeenCalled();
  });

  it("does not load the tracker when no domain is configured", async () => {
    const { syncAnalyticsConsent } = await import("../../app/consent/analytics");

    syncAnalyticsConsent({ necessary: true, analytics: true, marketing: false });

    expect(initMock).not.toHaveBeenCalled();
  });

  it("loads the tracker once analytics is granted and a domain is configured", async () => {
    const { syncAnalyticsConsent } = await import("../../app/consent/analytics");
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "example.com";

    syncAnalyticsConsent({ necessary: true, analytics: true, marketing: false });

    await vi.waitFor(() => expect(initMock).toHaveBeenCalledWith({ domain: "example.com" }));
  });

  it("only loads the tracker once even if called again", async () => {
    const { syncAnalyticsConsent } = await import("../../app/consent/analytics");
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "example.com";

    syncAnalyticsConsent({ necessary: true, analytics: true, marketing: false });
    await vi.waitFor(() => expect(initMock).toHaveBeenCalledTimes(1));

    syncAnalyticsConsent({ necessary: true, analytics: true, marketing: false });

    expect(initMock).toHaveBeenCalledTimes(1);
  });
});
