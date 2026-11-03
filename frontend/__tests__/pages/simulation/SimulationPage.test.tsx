import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/lib/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("@/app/components/Simulation/BetaSimulation", () => ({
  default: () => <div data-testid="beta" />,
}));
vi.mock("@/app/components/SimulationPro/ProSimulation", () => ({
  default: () => <div data-testid="pro" />,
}));

import { useAppSelector } from "@/app/lib/hooks";
import SimulationPage from "../../../app/(app)/simulation/page";

function withAuth(auth: { isAuthenticated: boolean; initializing: boolean }) {
  vi.mocked(useAppSelector).mockImplementation((selector) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({ auth } as any),
  );
}

describe("SimulationPage", () => {
  it("waits for the session check", () => {
    withAuth({ isAuthenticated: false, initializing: true });
    render(<SimulationPage />);
    expect(screen.getByLabelText("Chargement")).toBeTruthy();
    expect(screen.queryByTestId("beta")).toBeNull();
    expect(screen.queryByTestId("pro")).toBeNull();
  });

  it("shows the beta with an invitation to log in when logged out", () => {
    withAuth({ isAuthenticated: false, initializing: false });
    render(<SimulationPage />);
    expect(screen.getByTestId("beta")).toBeTruthy();
    expect(screen.getByText("Version bêta.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toBe("/login");
    expect(screen.queryByTestId("pro")).toBeNull();
  });

  it("shows the full simulation when logged in", () => {
    withAuth({ isAuthenticated: true, initializing: false });
    render(<SimulationPage />);
    expect(screen.getByTestId("pro")).toBeTruthy();
    expect(screen.queryByTestId("beta")).toBeNull();
  });
});
