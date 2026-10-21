import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import OrderSheet from "@/app/components/Simulation/OrderSheet";

describe("OrderSheet", () => {
  it("renders nothing when closed", () => {
    render(
      <OrderSheet open={false} onClose={vi.fn()}>
        form
      </OrderSheet>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a modal dialog titled « Passer un ordre » with focus on close", () => {
    render(
      <OrderSheet open onClose={vi.fn()}>
        form
      </OrderSheet>,
    );
    const dialog = screen.getByRole("dialog", { name: "Passer un ordre" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Fermer" }),
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes with the button and with Escape", () => {
    const onClose = vi.fn();
    render(
      <OrderSheet open onClose={onClose}>
        form
      </OrderSheet>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
