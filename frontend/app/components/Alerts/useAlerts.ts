"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/app/lib/hooks";
import type { ThunkTools } from "@/app/lib/auth/authFetch";
import {
  createAlert,
  deleteAlert,
  getAlerts,
  sendEmailConfirmation,
  setAlertActive,
  type AlertsOverview,
  type NewAlert,
  type PriceAlert,
} from "@/app/lib/api/alerts";

/**
 * The user's alerts, kept in this page's state: nothing else in the app reads
 * them. Actions reject with the API's message, for the caller to show.
 */
export function useAlerts() {
  const store = useAppStore();
  const tools = useMemo<ThunkTools>(
    () => ({ dispatch: store.dispatch, getState: store.getState }),
    [store],
  );
  const [overview, setOverview] = useState<AlertsOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAlerts(tools)
      .then((data) => {
        setOverview(data);
        setLoadError(null);
      })
      .catch((error: Error) => setLoadError(error.message));
  }, [tools]);

  useEffect(load, [load]);

  // The confirmation link opens in another tab: coming back here picks it up.
  const unconfirmed = overview !== null && !overview.email_verified;
  useEffect(() => {
    if (!unconfirmed) return;
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [unconfirmed, load]);

  const updateItems = (change: (items: PriceAlert[]) => PriceAlert[]) =>
    setOverview((current) =>
      current ? { ...current, items: change(current.items) } : current,
    );

  const add = async (alert: NewAlert) => {
    const created = await createAlert(alert, tools);
    updateItems((items) => [created, ...items]);
  };

  const setActive = async (alert: PriceAlert, isActive: boolean) => {
    const updated = await setAlertActive(alert.id, isActive, tools);
    updateItems((items) => items.map((a) => (a.id === updated.id ? updated : a)));
  };

  const remove = async (alert: PriceAlert) => {
    await deleteAlert(alert.id, tools);
    updateItems((items) => items.filter((a) => a.id !== alert.id));
  };

  const sendConfirmation = async () => {
    const { email_verified } = await sendEmailConfirmation(tools);
    if (email_verified) load();
  };

  return { overview, loadError, reload: load, add, setActive, remove, sendConfirmation };
}
