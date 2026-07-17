import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />,
}));

import { Persona } from "../../app/ui/Persona/Persona";

describe("Persona", () => {
  it("renders the name, role, introduction and social links", () => {
    render(
      <Persona
        image={"/me.png" as any}
        altImageDesc="Portrait"
        name="Abdel"
        role="Full Stack Developer"
        introduction="Bio"
        socialMedia={[{ icon: "/x.png" as any, link: "https://x.com/abdel" }]}
      />,
    );

    expect(screen.getByText("Abdel")).toBeTruthy();
    expect(screen.getByText("Full Stack Developer")).toBeTruthy();
    expect(screen.getByText("Bio")).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "https://x.com/abdel")).toBe(true);
  });

  it("renders without crashing when there is no social media", () => {
    render(
      <Persona
        image={"/me.png" as any}
        altImageDesc="Portrait"
        name="Abdel"
        role="Dev"
        introduction="Bio"
        socialMedia={[]}
      />,
    );
    expect(screen.getByText("Abdel")).toBeTruthy();
  });
});
