import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("../../app/context/SideBar/SideBareContext", () => ({
  useSidebar: vi.fn(),
}));
vi.mock("../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
}));

import { useSidebar } from "../../app/context/SideBar/SideBareContext";
import { useAppSelector } from "../../app/lib/hooks";
import SideBar from "../../app/components/SideBar/SideBar";

describe("SideBar", () => {
  it("shows the login link when the user is not authenticated", () => {
    vi.mocked(useSidebar).mockReturnValue({ isCollapsed: false, open: vi.fn(), close: vi.fn(), toggle: vi.fn() });
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: false } }),
    );

    render(<SideBar />);

    expect(screen.getByText("Authentification").closest("a")?.getAttribute("href")).toBe("/login");
    expect(screen.queryByText("Utilisateur")).toBeNull();
  });

  it("shows the profile link when the user is authenticated", () => {
    vi.mocked(useSidebar).mockReturnValue({ isCollapsed: false, open: vi.fn(), close: vi.fn(), toggle: vi.fn() });
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: true } }),
    );

    render(<SideBar />);

    expect(screen.getByText("Utilisateur").closest("a")?.getAttribute("href")).toBe("/profil");
  });

  it("calls toggle when the collapse button is clicked", () => {
    const toggle = vi.fn();
    vi.mocked(useSidebar).mockReturnValue({ isCollapsed: false, open: vi.fn(), close: vi.fn(), toggle });
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: false } }),
    );

    render(<SideBar />);

    screen.getByRole("button", { name: "Collapse sidebar" }).click();
    expect(toggle).toHaveBeenCalled();
  });

  it("shows the mobile expand button and expand label when collapsed", () => {
    vi.mocked(useSidebar).mockReturnValue({ isCollapsed: true, open: vi.fn(), close: vi.fn(), toggle: vi.fn() });
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { isAuthenticated: false } }),
    );

    render(<SideBar />);

    expect(screen.getAllByRole("button", { name: "Expand sidebar" }).length).toBeGreaterThan(0);
  });
});
