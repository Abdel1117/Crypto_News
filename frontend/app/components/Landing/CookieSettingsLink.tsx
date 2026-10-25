"use client";

import { useConsent } from "@/app/context/Consent/ConsentContext";

/** Footer entry that reopens the cookie preferences. */
export default function CookieSettingsLink({
  className = "",
}: {
  className?: string;
}) {
  const { openPreferencesPanel } = useConsent();
  return (
    <button
      type="button"
      onClick={openPreferencesPanel}
      className={`p-0 border-0 bg-transparent cursor-pointer font-[inherit] ${className}`}
    >
      Cookies
    </button>
  );
}
