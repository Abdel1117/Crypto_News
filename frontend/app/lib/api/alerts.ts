import type { Currency } from "@/app/context/Curency/CurrencyContext";
import { authFetchJson, type ThunkTools } from "../auth/authFetch";

const API = process.env.NEXT_PUBLIC_API_BACK_END;

export type AlertDirection = "above" | "below";

export interface PriceAlert {
  id: number;
  coin_id: string;
  symbol: string;
  name: string;
  image: string;
  currency: Currency;
  direction: AlertDirection;
  threshold: number;
  is_active: boolean;
  created_at: string;
  triggered_at: string | null;
  triggered_price: number | null;
}

export interface AlertsOverview {
  items: PriceAlert[];
  email: string;
  email_verified: boolean;
  /** False when the server can't check prices or send emails. */
  alerts_available: boolean;
  max_alerts: number;
  check_interval_seconds: number;
}

export interface NewAlert {
  coin_id: string;
  currency: Currency;
  direction: AlertDirection;
  /** As the API expects it: a dot as decimal separator, as typed otherwise. */
  threshold: string;
}

export function getAlerts(tools: ThunkTools): Promise<AlertsOverview> {
  return authFetchJson<AlertsOverview>(`${API}/alerts`, {}, tools);
}

export function createAlert(alert: NewAlert, tools: ThunkTools): Promise<PriceAlert> {
  return authFetchJson<PriceAlert>(
    `${API}/alerts`,
    { method: "POST", body: JSON.stringify(alert) },
    tools,
  );
}

export function setAlertActive(
  id: number,
  isActive: boolean,
  tools: ThunkTools,
): Promise<PriceAlert> {
  return authFetchJson<PriceAlert>(
    `${API}/alerts/${id}`,
    { method: "PATCH", body: JSON.stringify({ is_active: isActive }) },
    tools,
  );
}

export function deleteAlert(id: number, tools: ThunkTools): Promise<void> {
  return authFetchJson<void>(`${API}/alerts/${id}`, { method: "DELETE" }, tools);
}

/** Emails a confirmation link; `email_verified` is true if none was needed. */
export function sendEmailConfirmation(
  tools: ThunkTools,
): Promise<{ email_verified: boolean }> {
  return authFetchJson(`${API}/auth/email-verification`, { method: "POST" }, tools);
}
