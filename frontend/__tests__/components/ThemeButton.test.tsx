import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../app/context/Theme/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from "../../app/context/Theme/ThemeContext";
import { ThemeButton } from "../../app/components/ThemeButton/ThemeButton";

describe("ThemeButton", () => {
  it("renders the moon icon and toggles from light to dark", () => {
    const toggleTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: "light", toggleTheme, setTheme: vi.fn() });

    render(<ThemeButton />);

    const button = screen.getByRole("button", { name: /Activer le mode sombre/ });
    fireEvent.click(button);
    expect(toggleTheme).toHaveBeenCalled();
  });

  it("renders the sun icon and label when in dark mode", () => {
    vi.mocked(useTheme).mockReturnValue({ theme: "dark", toggleTheme: vi.fn(), setTheme: vi.fn() });

    render(<ThemeButton />);

    expect(screen.getByRole("button", { name: /Activer le mode clair/ })).toBeTruthy();
  });
});
