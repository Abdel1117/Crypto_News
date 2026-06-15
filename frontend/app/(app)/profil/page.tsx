"use client";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { logout } from "@/app/lib/features/auth/authSlice";
import { useRouter } from "next/navigation";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface rounded-2xl p-6 space-y-4 ${className}`}>
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-foreground/10 pb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-foreground bg-card rounded-lg px-4 py-2.5 break-all">
        {value}
      </span>
    </div>
  );
}

export default function ProfilPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?";

  const nameParts = user?.fullName?.trim().split(/\s+/) ?? [];
  const prenom = nameParts[0] ?? "—";
  const nom = nameParts.slice(1).join(" ") || "—";

  function handleLogout() {
    dispatch(logout());
    router.push("/login");
  }

  return (
    <section className="min-w-0 space-y-6 py-6">
      {/* Identity header — always full width */}
      <div className="bg-surface rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-background shrink-0">
          {avatarLetter}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {user?.fullName ?? user?.email ?? "—"}
          </h1>
          <p className="text-sm text-muted">{user?.email ?? "—"}</p>
          <p className="text-xs text-muted">ID : {user?.id ?? "—"}</p>
        </div>
      </div>

      {/* Card grid: 1 col → 2 col (sm) → 4 col (xl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Identité — 2 cols on xl */}
        <Card title="Identité" className="xl:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom" value={prenom} />
            <Field label="Nom" value={nom} />
          </div>
        </Card>

        {/* Compte — 1 col on xl */}
        <Card title="Compte">
          <Field label="Adresse e-mail" value={user?.email ?? "—"} />
          <Field label="Identifiant" value={user?.id ?? "—"} />
        </Card>

        {/* Sécurité — 1 col on xl */}
        <Card title="Sécurité">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Mot de passe</span>
            <span className="text-sm text-foreground bg-card rounded-lg px-4 py-2.5 opacity-50">
              ••••••••
            </span>
            <span className="text-xs text-muted mt-1">
              Modification disponible prochainement.
            </span>
          </div>
        </Card>

        {/* Danger — full width at bottom */}
        <Card title="Zone de danger" className="sm:col-span-2 xl:col-span-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted">
              Se déconnecter mettra fin à votre session sur cet appareil.
            </p>
            <button
              onClick={handleLogout}
              className="shrink-0 px-5 py-2.5 bg-danger text-white rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}
