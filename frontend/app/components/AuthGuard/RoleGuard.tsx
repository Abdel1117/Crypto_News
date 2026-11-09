"use client";

import Link from "next/link";
import { useAppSelector } from "@/app/lib/hooks";
import { hasRole } from "@/app/lib/auth/roles";
import type { Role } from "@/app/lib/features/auth/authSlice";
import { LockSimpleIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import AuthGuard from "./AuthGuard";

function Forbidden() {
  return (
    <div className="n-card items-start gap-3 p-6 lg:p-8 max-w-[560px]">
      <span className="w-10 h-10 grid place-items-center rounded-full bg-(--n-accent-800) text-(--n-accent-100)">
        <LockSimpleIcon size={18} />
      </span>
      <h2 className="m-0 text-xl">Accès réservé</h2>
      <p className="m-0 text-[15px] leading-relaxed text-(--n-neutral-400)">
        Cette page est réservée à l’équipe éditoriale. Si vous pensez devoir y
        accéder, demandez à un administrateur.
      </p>
      <Link href="/blog" className="n-btn n-btn-secondary min-h-10 mt-1">
        Retour au blog
      </Link>
    </div>
  );
}

function RoleGate({
  roles,
  children,
}: Readonly<{ roles: readonly Role[]; children: React.ReactNode }>) {
  const role = useAppSelector((state) => state.auth.user?.role);
  return hasRole(role, roles) ? <>{children}</> : <Forbidden />;
}

/**
 * Logged-in users with one of `roles` only. The menus hide these pages from
 * the others, and the API refuses them anyway: this is for direct links.
 */
export default function RoleGuard({
  roles,
  children,
}: Readonly<{ roles: readonly Role[]; children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <RoleGate roles={roles}>{children}</RoleGate>
    </AuthGuard>
  );
}
