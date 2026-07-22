"use client";
import { useEffect } from "react";

export default function PlausibleAnalytics() {
  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    if (!domain) return;

    import("@plausible-analytics/tracker").then(({ init }) => init({ domain }));
  }, []);

  return null;
}
