import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../../app/context/Theme/ThemeContext";

function Probe() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span>theme-{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("dark")}>set-dark</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("throws when used outside of the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow("useTheme must be used within ThemeProvider");
    consoleError.mockRestore();
  });

  it("defaults to light and applies the class to <html>", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("theme-light")).toBeTruthy();
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("hydrates from a persisted theme", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("theme-dark")).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to the class already set by ThemeScript when nothing is persisted", () => {
    document.documentElement.classList.add("dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText("theme-dark")).toBeTruthy();
  });

  it("toggles the theme and persists it", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText("toggle"));
    });

    expect(screen.getByText("theme-dark")).toBeTruthy();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("sets an explicit theme", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText("set-dark"));
    });

    expect(screen.getByText("theme-dark")).toBeTruthy();
  });
});
