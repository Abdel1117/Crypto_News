import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSelector } from "react-redux";
import { ReduxProvider } from "../../app/providers/redux-provider";

function Probe() {
  const loading = useSelector((state: any) => state.prices.loading);
  return <span>loading-{String(loading)}</span>;
}

describe("ReduxProvider", () => {
  it("provides the real store to descendants", () => {
    render(
      <ReduxProvider>
        <Probe />
      </ReduxProvider>,
    );
    expect(screen.getByText(/loading-/)).toBeTruthy();
  });
});
