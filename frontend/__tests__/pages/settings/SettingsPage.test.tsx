import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import SettingsPage from "../../../app/(app)/settings/page";

describe("SettingsPage", () => {
  it("renders without crashing", () => {
    const { container } = render(<SettingsPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the placeholder content", () => {
    render(<SettingsPage />);
    expect(screen.getByText("page")).toBeTruthy();
  });
});
