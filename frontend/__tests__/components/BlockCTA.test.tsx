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
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : ""} alt={alt} {...props} />
  ),
}));

import BlockCTA from "../../app/components/BlockCTA/BlockCTA";

const baseProps = {
  imageSrc: "/img.png",
  captionTitle: "Caption",
  title: "Title",
  underTitle: "Undertitle",
  firstParam: "First paragraph",
  secondParam: "Second paragraph",
  boutonText: "Go",
  boutonHref: "/go",
  notReversed: true,
  hidebutton: false,
};

describe("BlockCTA", () => {
  it("renders the text content and the button by default", () => {
    render(<BlockCTA {...baseProps} />);

    expect(screen.getByText("Caption")).toBeTruthy();
    expect(screen.getByText("First paragraph")).toBeTruthy();
    expect(screen.getByText("Second paragraph")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Go" });
    expect(link.getAttribute("href")).toBe("/go");
  });

  it("hides the button when hidebutton is true", () => {
    render(<BlockCTA {...baseProps} hidebutton />);
    expect(screen.queryByRole("link", { name: "Go" })).toBeNull();
  });

  it("reverses the layout when notReversed is false", () => {
    const { container } = render(<BlockCTA {...baseProps} notReversed={false} />);
    expect(container.querySelector(".lg\\:flex-row-reverse")).toBeTruthy();
  });
});
