import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AppTemplate from "../../app/(app)/template";

describe("AppTemplate", () => {
  it("wraps children in a page-transition container", () => {
    const { container } = render(
      <AppTemplate>
        <span>content</span>
      </AppTemplate>,
    );
    expect(screen.getByText("content")).toBeTruthy();
    expect(container.querySelector(".page-transition")).toBeTruthy();
  });
});
