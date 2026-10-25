import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout, {
  metadata as dashboard,
} from "../../app/(app)/dashboard/layout";
import { metadata as simulation } from "../../app/(app)/simulation/layout";
import { metadata as heatmap } from "../../app/(app)/heatmap/layout";
import { metadata as profil } from "../../app/(app)/profil/layout";
import { metadata as settings } from "../../app/(app)/settings/page";

describe("App route titles", () => {
  it("gives every app page its own tab title", () => {
    expect(dashboard.title).toBe("Dashboard");
    expect(simulation.title).toBe("Portefeuille virtuel");
    expect(heatmap.title).toBe("Heatmap du marché");
    expect(profil.title).toBe("Profil");
    expect(settings.title).toBe("Paramètres");
  });

  it("only wraps the page, without extra markup", () => {
    const { container } = render(
      <DashboardLayout>
        <p>page</p>
      </DashboardLayout>,
    );
    expect(screen.getByText("page")).toBeTruthy();
    expect(container.innerHTML).toBe("<p>page</p>");
  });
});
