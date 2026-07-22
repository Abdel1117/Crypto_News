import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));
vi.mock("@/public/images/product/1.png", () => ({ default: "/1.png" }));
vi.mock("@/public/images/product/2.png", () => ({ default: "/2.png" }));
vi.mock("@/public/images/product/3.png", () => ({ default: "/3.png" }));
vi.mock("@/public/images/product/4.png", () => ({ default: "/4.png" }));
vi.mock("@/public/images/product/5.png", () => ({ default: "/5.png" }));
vi.mock("@/public/images/product/6.png", () => ({ default: "/6.png" }));

import ProductDescription from "../../app/components/ProductDescription/ProductDescription";

describe("ProductDescription", () => {
  it("renders all six product cards", () => {
    render(<ProductDescription />);

    expect(screen.getByText("Suivi en temps réel")).toBeTruthy();
    expect(screen.getByText("Tableau de bord personnalisé")).toBeTruthy();
    expect(screen.getByText("Simulation de portefeuille")).toBeTruthy();
    expect(screen.getByText("Graphiques & analytique")).toBeTruthy();
    expect(screen.getByText("Intégration wallet")).toBeTruthy();
    expect(screen.getByText("Interface intuitive")).toBeTruthy();
  });
});
