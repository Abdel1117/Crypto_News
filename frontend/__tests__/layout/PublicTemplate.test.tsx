import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PublicTemplate from "../../app/(public)/template";

describe("PublicTemplate", () => {
  it("wraps children in a page-transition container", () => {
    const { container } = render(
      <PublicTemplate>
        <span>content</span>
      </PublicTemplate>,
    );
    expect(screen.getByText("content")).toBeTruthy();
    expect(container.querySelector(".page-transition")).toBeTruthy();
  });
});
