import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../app/components/UserBar/UserBar", () => ({
  default: () => <div>UserBar</div>,
}));

import { SidebarProvider } from "../../../app/context/SideBar/SideBareContext";
import DashBoardHeader from "../../../app/components/DashBoardHeader/DashBoardHeader";

describe("DashBoardHeader", () => {
  it("renders the dashboard title and mobile menu button", () => {
    render(
      <SidebarProvider>
        <DashBoardHeader />
      </SidebarProvider>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByRole("button", { name: /open menu/i })).toBeTruthy();
  });

  it("toggles the mobile menu button label when clicked", () => {
    render(
      <SidebarProvider>
        <DashBoardHeader />
      </SidebarProvider>,
    );

    const toggleButton = screen.getByRole("button", { name: /open menu/i });
    expect(toggleButton).toBeTruthy();
    fireEvent.click(toggleButton);

    expect(screen.getByRole("button", { name: /close menu/i })).toBeTruthy();
  });
});
