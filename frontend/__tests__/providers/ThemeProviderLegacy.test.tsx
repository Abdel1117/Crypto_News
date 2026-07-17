import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useTheme } from "../../app/context/Theme/ThemeContext";
import { Providers } from "../../app/providers/theme-provider";

function Probe() {
  const { theme } = useTheme();
  return <span>theme-{theme}</span>;
}

describe("theme-provider Providers (legacy/unused wrapper)", () => {
  it("wraps children with the theme context", () => {
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByText(/theme-/)).toBeTruthy();
  });
});
