import type { ConsentPreferences } from "@/app/context/Consent/ConsentContext";

/**
 * Loads the real Plausible tracker — the exact `init` call that used to run
 * unconditionally from `PlausibleAnalytics.tsx` on every page load, now only
 * reachable once the "analytics" category is granted.
 */
let plausibleLoaded = false;

export function syncAnalyticsConsent(preferences: ConsentPreferences): void {
  if (!preferences.analytics || plausibleLoaded) return;

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;

  plausibleLoaded = true;
  import("@plausible-analytics/tracker").then(({ init }) => init({ domain }));
}
