import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Partners from "../../app/components/Partners/Partners";

describe("Partners", () => {
  it("renders the frontend and backend tech stack cards", () => {
    render(<Partners />);

    expect(screen.getByText("Next.js")).toBeTruthy();
    expect(screen.getByText("Redux Toolkit")).toBeTruthy();
    expect(screen.getByText("FastAPI")).toBeTruthy();
    expect(screen.getByText("PostgreSQL")).toBeTruthy();
  });
});
