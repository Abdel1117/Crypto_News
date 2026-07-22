import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthorChip } from "../../app/ui/AuthorChip/AuthorChip";

describe("AuthorChip", () => {
  it("renders the author initial, name and read time", () => {
    render(<AuthorChip initial="A" name="Alice Dupont" date="12 juin 2025" readTime="5 min" />);

    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("Alice Dupont")).toBeTruthy();
    expect(screen.getByText("5 min")).toBeTruthy();
  });
});
