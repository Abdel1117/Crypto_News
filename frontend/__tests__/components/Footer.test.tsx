import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../../app/components/Footer/Footer";

describe("Footer", () => {
  it("renders the copyright notice with the current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© Copyright ${year}`))).toBeTruthy();
  });
});
