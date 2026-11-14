import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import RoleGuard from "@/app/components/AuthGuard/RoleGuard";
import { EDITORIAL_ROLES } from "@/app/lib/auth/roles";
import type { Role } from "@/app/lib/features/auth/authSlice";
import { renderWithAuth } from "../../lib/blogTestUtils";

function renderGuard(role: Role | null, roles: readonly Role[] = EDITORIAL_ROLES) {
  return renderWithAuth(
    <RoleGuard roles={roles}>
      <p>Contenu secret</p>
    </RoleGuard>,
    role,
  );
}

describe("RoleGuard", () => {
  it.each(["editor", "admin"] as const)("lets %s in", (role) => {
    renderGuard(role);
    expect(screen.getByText("Contenu secret")).toBeTruthy();
  });

  it("shows « Accès réservé » to plain readers", () => {
    renderGuard("user");
    expect(screen.queryByText("Contenu secret")).toBeNull();
    expect(screen.getByRole("heading", { name: "Accès réservé" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Retour au blog" }).getAttribute("href")).toBe("/blog");
  });

  it("keeps editors out of admin-only pages", () => {
    renderGuard("editor", ["admin"]);
    expect(screen.getByRole("heading", { name: "Accès réservé" })).toBeTruthy();
  });

  it("sends logged-out visitors to the login page", () => {
    renderGuard(null);
    expect(screen.queryByText("Contenu secret")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
