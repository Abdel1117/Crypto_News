import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginLayout, { metadata } from "../../app/(public)/login/layout";

describe("LoginLayout", () => {
  it("renders its children", () => {
    render(
      <LoginLayout>
        <span>login page</span>
      </LoginLayout>,
    );
    expect(screen.getByText("login page")).toBeTruthy();
  });

  it("exports SEO metadata that de-indexes the login page", () => {
    expect(metadata.title).toBe("Connexion");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
