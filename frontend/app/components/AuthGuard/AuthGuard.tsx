"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/lib/hooks";

// Gates pages that require an authenticated session (e.g. /profil, /settings).
// Waits for AuthBootstrap's initial refreshSession() to resolve before deciding,
// so a valid session restored from the httpOnly refresh cookie isn't bounced to /login.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [initializing, isAuthenticated, router]);

  if (initializing || !isAuthenticated) {
    return (
      <div className="bg-card border-l-3 border-primary rounded-lg p-4 min-w-[220px] min-h-[120px] animate-pulse" />
    );
  }

  return <>{children}</>;
}
