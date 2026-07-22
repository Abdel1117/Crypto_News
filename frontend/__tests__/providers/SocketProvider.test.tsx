import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../app/lib/initSocket", () => ({
  initSocket: vi.fn(),
}));

import { initSocket } from "../../app/lib/initSocket";
import { SocketProvider } from "../../app/providers/socket-provider";

describe("SocketProvider", () => {
  it("initializes the websocket connection once on mount and renders children", () => {
    render(
      <SocketProvider>
        <span>content</span>
      </SocketProvider>,
    );

    expect(initSocket).toHaveBeenCalledTimes(1);
    expect(screen.getByText("content")).toBeTruthy();
  });
});
