"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { syncAnalyticsConsent } from "./analytics";

export type ConsentCategoryId = "necessary" | "analytics" | "marketing";

/**
 * `necessary` is always `true` — it isn't a user choice, it's a fact about
 * cookies required for the site to function (session, security, remembering
 * this very consent). `analytics`/`marketing` default to `false` and only
 * flip to `true` after an explicit user action.
 */
export interface ConsentPreferences {
  readonly necessary: true;
  analytics: boolean;
  marketing: boolean;
}

interface ConsentState {
  preferences: ConsentPreferences;
  consentedAt: string;
  policyVersion: string;
}

export interface CookieCategoryConfig {
  id: ConsentCategoryId;
  title: string;
  description: string;
  required: boolean;
}

/**
 * Bump this whenever the cookie categories, their purposes, or the
 * third-party services behind them change — a stored consent whose
 * `policyVersion` doesn't match is treated as stale and re-asked.
 */
const CONSENT_POLICY_VERSION = "1.0.0";
const STORAGE_KEY = "consent";

export const COOKIE_CATEGORIES: Record<ConsentCategoryId, CookieCategoryConfig> = {
  necessary: {
    id: "necessary",
    title: "Strictement nécessaires",
    description:
      "Indispensables au fonctionnement du site, à la sécurité, à l'authentification et à la mémorisation de votre choix de consentement. Ils ne nécessitent pas votre accord, mais nous vous informons de leur usage.",
    required: true,
  },
  analytics: {
    id: "analytics",
    title: "Mesure d'audience",
    description:
      "Nous aident à comprendre comment le site est utilisé (pages consultées, fréquentation) afin de l'améliorer. Désactivés par défaut, activés uniquement avec votre accord.",
    required: false,
  },
  marketing: {
    id: "marketing",
    title: "Marketing et publicité",
    description:
      "Utilisés pour personnaliser les contenus publicitaires et mesurer leur performance. Jamais chargés avant votre accord explicite.",
    required: false,
  },
};

function createDefaultConsentPreferences(): ConsentPreferences {
  return { necessary: true, analytics: false, marketing: false };
}

function isConsentPreferences(value: unknown): value is ConsentPreferences {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.necessary === true &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.marketing === "boolean"
  );
}

function isConsentState(value: unknown): value is ConsentState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.consentedAt === "string" &&
    typeof candidate.policyVersion === "string" &&
    isConsentPreferences(candidate.preferences)
  );
}

/**
 * Reads/writes consent through `localStorage`, guarded like the app's other
 * client-only storage (see `ThemeContext`): storage access only ever runs
 * inside effects/handlers (never render), wrapped in try/catch so a
 * disabled/full storage never crashes the app — consent just falls back to
 * "not yet given" for that session. Payloads are runtime-checked rather than
 * trusted via a cast, so corrupted or old-shape data (a previous policy's
 * JSON, manual tampering) is treated as absent instead of silently accepted.
 */
function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isConsentState(parsed)) return null;
    return parsed.policyVersion === CONSENT_POLICY_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function saveConsent(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore — consent still holds in memory for this session
  }
}

interface ConsentContextValue {
  preferences: ConsentPreferences;
  consentedAt: string | null;
  /** True once storage has been read and no current-policy consent exists. */
  needsConsent: boolean;
  isPreferencesPanelOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: Pick<ConsentPreferences, "analytics" | "marketing">) => void;
  openPreferencesPanel: () => void;
  closePreferencesPanel: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsentState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isPreferencesPanelOpen, setPreferencesPanelOpen] = useState(false);

  // 1. Hydrate from storage once, client-side only.
  useEffect(() => {
    setState(loadConsent());
    setHydrated(true);
  }, []);

  // 2. Persist whenever consent is (re)recorded.
  useEffect(() => {
    if (!hydrated || !state) return;
    saveConsent(state);
  }, [state, hydrated]);

  // 3. Sync the current preferences to gated third-party trackers — never
  //    runs before hydration, so nothing can load ahead of knowing the
  //    real, persisted consent.
  useEffect(() => {
    if (!hydrated) return;
    syncAnalyticsConsent(state?.preferences ?? createDefaultConsentPreferences());
  }, [state, hydrated]);

  const commit = (preferences: ConsentPreferences) => {
    setState({
      preferences: { ...preferences, necessary: true },
      consentedAt: new Date().toISOString(),
      policyVersion: CONSENT_POLICY_VERSION,
    });
    setPreferencesPanelOpen(false);
  };

  const value: ConsentContextValue = {
    preferences: state?.preferences ?? createDefaultConsentPreferences(),
    consentedAt: state?.consentedAt ?? null,
    needsConsent: hydrated && state === null,
    isPreferencesPanelOpen,
    acceptAll: () => commit({ necessary: true, analytics: true, marketing: true }),
    rejectAll: () => commit({ necessary: true, analytics: false, marketing: false }),
    savePreferences: (partial) => commit({ necessary: true, ...partial }),
    openPreferencesPanel: () => setPreferencesPanelOpen(true),
    closePreferencesPanel: () => setPreferencesPanelOpen(false),
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
}
