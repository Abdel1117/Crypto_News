import React from "react";
import { describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { store } from "../../app/lib/store";
import { useAppDispatch, useAppSelector } from "../../app/lib/hooks";

function Probe() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.prices.loading);
  return (
    <div>
      <span>dispatch-is-{typeof dispatch}</span>
      <span>loading-{String(loading)}</span>
    </div>
  );
}

describe("typed redux hooks", () => {
  it("exposes a working dispatch and selector against the real store", () => {
    render(
      <Provider store={store}>
        <Probe />
      </Provider>,
    );

    expect(screen.getByText("dispatch-is-function")).toBeTruthy();
    expect(screen.getByText(/loading-/)).toBeTruthy();
  });
});
