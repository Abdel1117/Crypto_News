import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedNumber } from "../../../app/components/CountDown/AnimatedNumber";

describe("AnimatedNumber", () => {
  it("renders the given value", () => {
    render(<AnimatedNumber value="42" />);
    expect(screen.getByText("42")).toBeTruthy();
  });
});
