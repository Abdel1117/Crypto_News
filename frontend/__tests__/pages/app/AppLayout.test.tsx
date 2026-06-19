import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../../app/components/SideBar/SideBar", () => ({
  default: () => <aside data-testid="sidebar">SideBar</aside>,
}));

vi.mock("../../../app/components/DashBoardHeader/DashBoardHeader", () => ({
  default: () => (
    <header data-testid="dashboard-header">DashBoardHeader</header>
  ),
}));

import AppLayout from "../../../app/(app)/layout";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AppLayout", () => {
  it("renders without crashing", () => {
    const { container } = render(<AppLayout>content</AppLayout>);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the SideBar", () => {
    render(<AppLayout>content</AppLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
  });

  it("renders the DashBoardHeader", () => {
    render(<AppLayout>content</AppLayout>);
    expect(screen.getByTestId("dashboard-header")).toBeTruthy();
  });

  it("renders children inside the main element", () => {
    render(
      <AppLayout>
        <span data-testid="child-node">child content</span>
      </AppLayout>,
    );
    const main = screen.getByRole("main");
    expect(main).toBeTruthy();
    expect(screen.getByTestId("child-node")).toBeTruthy();
  });

  it("places children content inside main", () => {
    render(<AppLayout><p>Hello from child</p></AppLayout>);
    expect(screen.getByRole("main").textContent).toContain("Hello from child");
  });

  it("wraps the layout in a full-height container", () => {
    const { container } = render(<AppLayout>x</AppLayout>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("min-h-screen");
  });
});
