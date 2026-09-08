"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { refreshSession } from "@/app/lib/features/auth/authThunks";

// Refresh this many ms before the access token actually expires, so the
// rotation happens silently instead of racing an expired token.
const REFRESH_MARGIN_MS = 5000;

// Restores the session on load from the httpOnly refresh cookie (the access
// token itself is never persisted), then keeps it alive by rotating the
// token shortly before each expiry. Mounted once at the app root.
export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isAuthenticated || !expiresAt) return;

    const delay = Math.max(expiresAt - Date.now() - REFRESH_MARGIN_MS, 0);
    timerRef.current = window.setTimeout(() => {
      dispatch(refreshSession());
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [dispatch, isAuthenticated, expiresAt]);

  return null;
}
