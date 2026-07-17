import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));

import CardProduct from "../../app/components/CardProduct/CardProduct";

describe("CardProduct", () => {
  it("renders the title and description", () => {
    render(
      <CardProduct image={"/img.png" as any} title="Suivi en temps réel" paragraphe="Description" />,
    );

    expect(screen.getByText("Suivi en temps réel")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
  });
});
