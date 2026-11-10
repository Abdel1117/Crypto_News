import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ArticleBody from "@/app/components/Blog/ArticleBody";

function renderBody(markdown: string) {
  return render(<ArticleBody markdown={markdown} className="extra" />);
}

describe("ArticleBody", () => {
  it("renders Markdown in the reading typography", () => {
    const { container } = renderBody("## Intertitre\n\nDu **gras** et une liste :\n\n- un\n- deux");
    expect(container.firstElementChild?.className).toContain("n-prose");
    expect(container.firstElementChild?.className).toContain("extra");
    expect(screen.getByRole("heading", { level: 2, name: "Intertitre" })).toBeTruthy();
    expect(screen.getByText("gras").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("turns a Markdown h1 into an h2 (the page title is the only h1)", () => {
    renderBody("# Titre");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Titre" })).toBeTruthy();
  });

  it("shows raw HTML as text instead of running it", () => {
    const { container } = renderBody('Texte <img src=x onerror="alert(1)"> <b>fin</b>');
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("<b>fin</b>");
  });

  it("drops javascript: links", () => {
    renderBody("[piège](javascript:alert(1))");
    expect(screen.getByText("piège").getAttribute("href")).toBe("");
  });

  it("opens external links in a new tab, keeps internal ones", () => {
    renderBody("[dehors](https://example.com) et [dedans](/blog)");
    const outside = screen.getByRole("link", { name: "dehors" });
    expect(outside.getAttribute("target")).toBe("_blank");
    expect(outside.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    expect(outside.hasAttribute("node")).toBe(false);
    expect(screen.getByRole("link", { name: "dedans" }).getAttribute("target")).toBeNull();
  });

  it("loads images lazily, with an alt text", () => {
    renderBody("![Un graphique](https://example.com/g.png)");
    const img = screen.getByRole("img", { name: "Un graphique" });
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("renders GitHub-flavored tables", () => {
    renderBody("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
