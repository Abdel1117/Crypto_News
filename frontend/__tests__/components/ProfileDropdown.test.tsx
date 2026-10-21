import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../../app/lib/hooks", () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

vi.mock("../../app/lib/auth/api", () => ({
  logoutUser: vi.fn(),
}));

import { useAppSelector, useAppDispatch } from "../../app/lib/hooks";
import { logoutUser } from "../../app/lib/auth/api";
import ProfileDropdown from "../../app/components/ProfileDropdown/ProfileDropdown";

describe("ProfileDropdown", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppDispatch).mockReturnValue(dispatch);
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { user: { email: "ada@example.com" } } }),
    );
  });

  it("shows the avatar initial from the user's email", () => {
    render(<ProfileDropdown />);
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("shows '?' when there is no user", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({ auth: { user: null } }),
    );
    render(<ProfileDropdown />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("opens the menu and navigates to the profile link", () => {
    render(<ProfileDropdown />);
    fireEvent.click(screen.getByText("A"));

    const profileLink = screen.getByRole("menuitem", { name: "Mon profil" });
    expect(profileLink.getAttribute("href")).toBe("/profil");
  });

  it("logs out, clears auth state and redirects to login", async () => {
    vi.mocked(logoutUser).mockResolvedValue(undefined);
    render(<ProfileDropdown />);

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Se déconnecter"));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("still logs out locally even if the api call fails", async () => {
    vi.mocked(logoutUser).mockRejectedValue(new Error("network"));
    render(<ProfileDropdown />);

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText("Se déconnecter"));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("is an accessible menu that closes with Escape", () => {
    render(<ProfileDropdown />);
    const trigger = screen.getByRole("button", { name: /Menu du compte/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(
      screen.getByRole("menuitem", { name: "Dashboard" }).getAttribute("href"),
    ).toBe("/dashboard");
    expect(screen.getByText("ada@example.com")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("uses the full name initial when there is one", () => {
    vi.mocked(useAppSelector).mockImplementation((selector: any) =>
      selector({
        auth: { user: { email: "z@example.com", fullName: "Bob Martin" } },
      }),
    );
    render(<ProfileDropdown />);
    expect(screen.getByText("B")).toBeTruthy();
  });
});
