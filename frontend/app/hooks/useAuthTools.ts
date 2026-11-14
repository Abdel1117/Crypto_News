"use client";

import { useMemo } from "react";
import { useStore } from "react-redux";
import { useAppDispatch } from "@/app/lib/hooks";
import type { ThunkTools } from "@/app/lib/auth/authFetch";
import type { RootState } from "@/app/lib/store";

/**
 * What authFetchJson needs to read (and refresh) the access token, for
 * requests made straight from a component instead of a thunk.
 */
export function useAuthTools(): ThunkTools {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  return useMemo(
    () => ({ dispatch, getState: store.getState }),
    [dispatch, store],
  );
}
