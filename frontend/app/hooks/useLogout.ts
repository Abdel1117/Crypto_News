"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/lib/hooks";
import { logout } from "@/app/lib/features/auth/authSlice";
import { logoutUser } from "@/app/lib/auth/api";

/** Ends the session server-side (refresh cookie), clears it locally, goes to /login. */
export function useLogout() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      /* cookie déjà expiré ou réseau : on déconnecte quand même localement */
    }
    dispatch(logout());
    router.push("/login");
  }, [dispatch, router]);
}
