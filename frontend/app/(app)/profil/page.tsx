"use client";

import { useAppSelector } from "@/app/lib/hooks";
import { useLogout } from "@/app/hooks/useLogout";
import AuthGuard from "@/app/components/AuthGuard/AuthGuard";
import {
  LockSimpleIcon,
  SignOutIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import { SettingsList, SettingsRow } from "@/app/ui/SettingsList/SettingsList";

function ReadOnlyInput({
  id,
  label,
  value,
  muted = false,
}: {
  id: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="n-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`n-text-input lg:min-h-10! ${muted ? "text-(--n-neutral-300)!" : ""}`}
        type="text"
        value={value}
        readOnly
      />
    </div>
  );
}

export default function ProfilPage() {
  const { user } = useAppSelector((state) => state.auth);
  const logout = useLogout();

  const fullName = user?.fullName?.trim() || "";
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const displayName = fullName || user?.email || "—";
  const email = user?.email ?? "—";
  const avatarLetter = (fullName || user?.email || "?").charAt(0).toUpperCase();

  // No endpoint updates the name yet: the fields are shown read-only.
  const nameHint = "Modification du nom disponible prochainement.";

  return (
    <AuthGuard>
      <div className="flex flex-col gap-[18px] lg:gap-7 lg:max-w-[880px] lg:pt-2 min-h-[calc(100dvh-60px-96px-4px)] lg:min-h-0">
        <div className="flex items-center gap-3.5 lg:gap-[18px]">
          <span
            aria-hidden="true"
            className="w-[52px] h-[52px] lg:w-16 lg:h-16 flex-none rounded-full grid place-items-center text-[21px] lg:text-[26px] font-medium bg-(--n-accent-800) text-(--n-accent-100) shadow-[0_0_0_1px_var(--n-accent),0_0_32px_-10px_var(--n-accent)]"
          >
            {avatarLetter}
          </span>
          <div className="flex flex-col gap-0.5 lg:gap-1 min-w-0">
            <p className="m-0 text-[19px] lg:text-[26px] font-medium tracking-[-0.01em] truncate">
              {displayName}
            </p>
            <p className="m-0 text-[13px] lg:text-sm text-(--n-neutral-400) truncate">
              {email}
            </p>
          </div>
        </div>

        {/* Desktop: one settings list */}
        <SettingsList className="hidden lg:flex">
          <SettingsRow title="Identité">
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyInput id="p-first" label="Prénom" value={firstName} />
                <ReadOnlyInput id="p-last" label="Nom" value={lastName} />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="n-btn n-btn-primary" disabled>
                  Enregistrer
                </button>
                <span className="text-[13px] text-(--n-neutral-500)">
                  {nameHint}
                </span>
              </div>
            </div>
          </SettingsRow>
          <SettingsRow title="Compte">
            <ReadOnlyInput
              id="p-mail"
              label="Adresse e-mail"
              value={email}
              muted
            />
          </SettingsRow>
          <SettingsRow title="Sécurité">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5 mr-auto">
                <span className="text-sm">Mot de passe</span>
                <span className="text-[13px] text-(--n-neutral-500)">
                  Modification disponible prochainement.
                </span>
              </div>
              <button type="button" className="n-btn n-btn-secondary" disabled>
                Modifier
              </button>
            </div>
          </SettingsRow>
          <SettingsRow title="Session" last>
            <div className="flex items-center gap-4">
              <span className="mr-auto text-sm text-(--n-neutral-300)">
                Se déconnecter mettra fin à votre session sur cet appareil.
              </span>
              <button
                type="button"
                className="n-btn n-btn-secondary flex-none"
                onClick={logout}
              >
                <SignOutIcon />
                Se déconnecter
              </button>
            </div>
          </SettingsRow>
        </SettingsList>

        {/* Mobile */}
        <section
          className="lg:hidden flex flex-col gap-3 p-3.5 n-panel"
          aria-labelledby="identity-title"
        >
          <h2 id="identity-title" className="n-kicker m-0 font-normal!">
            Identité
          </h2>
          <ReadOnlyInput id="pm-first" label="Prénom" value={firstName} />
          <ReadOnlyInput id="pm-last" label="Nom" value={lastName} />
          <p className="m-0 text-xs text-(--n-neutral-500)">{nameHint}</p>
        </section>
        <ul
          className="lg:hidden m-0 p-0 list-none flex flex-col gap-px rounded-lg overflow-hidden"
          style={{
            background:
              "color-mix(in srgb, var(--n-text) 7%, var(--n-surface))",
          }}
        >
          <li className="flex flex-col justify-center gap-0.5 min-h-[60px] px-3.5 bg-(--n-surface)">
            <span className="text-xs text-(--n-neutral-400)">
              Adresse e-mail
            </span>
            <span className="text-[15px] truncate">{email}</span>
          </li>
          <li className="flex items-center min-h-[60px] px-3.5 bg-(--n-surface)">
            <div className="flex flex-col gap-0.5 mr-auto">
              <span className="text-[15px]">Mot de passe</span>
              <span className="text-xs text-(--n-neutral-500)">
                Modification disponible prochainement.
              </span>
            </div>
            <LockSimpleIcon size={18} className="text-(--n-neutral-500)" />
          </li>
        </ul>
        <button
          type="button"
          className="lg:hidden n-btn n-btn-secondary mt-auto w-full min-h-12 text-[15px]!"
          onClick={logout}
        >
          <SignOutIcon />
          Se déconnecter
        </button>
      </div>
    </AuthGuard>
  );
}
