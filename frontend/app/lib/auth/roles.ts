import type { Role } from "../features/auth/authSlice";

/** Roles that write, edit and delete blog articles (and delete any comment). */
export const EDITORIAL_ROLES: readonly Role[] = ["editor", "admin"];

export function hasRole(
  role: Role | null | undefined,
  allowed: readonly Role[],
): boolean {
  return !!role && allowed.includes(role);
}

export const isEditorial = (role: Role | null | undefined) =>
  hasRole(role, EDITORIAL_ROLES);
