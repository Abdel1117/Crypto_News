import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  HeaderActions,
  HeaderSlotsContext,
  HeaderTitleExtra,
} from "@/app/components/AppShell/HeaderSlots";

function Shell({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<HTMLElement | null>(null);
  const [actions, setActions] = useState<HTMLElement | null>(null);
  return (
    <HeaderSlotsContext.Provider value={{ title, actions }}>
      <header>
        <div data-testid="title-slot" ref={setTitle} />
        <div data-testid="actions-slot" ref={setActions} />
      </header>
      <main>{children}</main>
    </HeaderSlotsContext.Provider>
  );
}

describe("HeaderSlots", () => {
  it("renders page content into the top bar", () => {
    render(
      <Shell>
        <HeaderTitleExtra>
          <span>Top 50</span>
        </HeaderTitleExtra>
        <HeaderActions>
          <button type="button">Actualiser</button>
        </HeaderActions>
      </Shell>,
    );
    expect(screen.getByTestId("title-slot").textContent).toBe("Top 50");
    expect(screen.getByTestId("actions-slot").textContent).toBe("Actualiser");
    expect(screen.getByRole("main").textContent).toBe("");
  });

  it("renders nothing outside the shell", () => {
    const { container } = render(
      <HeaderActions>
        <button type="button">Actualiser</button>
      </HeaderActions>,
    );
    expect(container.textContent).toBe("");
  });
});
