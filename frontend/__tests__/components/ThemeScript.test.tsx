import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ThemeScript } from "../../app/components/ThemeScript/ThemeScript";

describe("ThemeScript", () => {
  it("renders an inline script that reads the persisted theme", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");

    expect(script).toBeTruthy();
    expect(script?.innerHTML).toContain("localStorage.getItem('theme')");
    expect(script?.innerHTML).toContain("prefers-color-scheme: dark");
  });
});
