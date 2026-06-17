/* eslint-disable @next/next/no-img-element */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

type MockNextLinkProps = React.PropsWithChildren<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: unknown;
  }
>;

type MockNextImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src: unknown;
  alt?: string;
};

vi.mock("next/link", () => {
  return {
    default: ({ href, children, ...props }: MockNextLinkProps) => {
      const resolvedHref =
        typeof href === "string"
          ? href
          : typeof href === "object" &&
              href !== null &&
              "pathname" in href &&
              typeof (href as { pathname?: unknown }).pathname === "string"
            ? (href as { pathname: string }).pathname
            : "";

      return (
        <a href={resolvedHref} {...props}>
          {children}
        </a>
      );
    },
  };
});

vi.mock("next/image", () => {
  return {
    default: ({ src, alt, ...props }: MockNextImageProps) => {
      const resolvedSrc =
        typeof src === "string"
          ? src
          : typeof src === "object" &&
              src !== null &&
              "src" in src &&
              typeof (src as { src?: unknown }).src === "string"
            ? (src as { src: string }).src
            : "";

      return <img src={resolvedSrc} alt={alt ?? ""} {...props} />;
    },
  };
});

vi.mock("@/public/icons/svg/close-menu.svg", () => ({
  default: "close-menu.svg",
}));

vi.mock("@/public/icons/svg/mobile-menu.svg", () => ({
  default: "mobile-menu.svg",
}));

vi.mock("../../../app/components/ThemeButton/ThemeButton", () => ({
  ThemeButton: () => <button type="button">Theme</button>,
}));

vi.mock("../../../app/components/Icons/CryptoLogo", () => ({
  CryptoLogo: () => <span>LOGO</span>,
}));

vi.mock("@/app/lib/hooks", () => ({
  useAppSelector: vi.fn(() => ({ isAuthenticated: false, user: null })),
  useAppDispatch: vi.fn(() => () => {}),
}));

import Header from "../../../app/components/Header/Header";

describe("Header", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  it("renders the logo and desktop nav links", () => {
    render(<Header />);

    expect(screen.getByText("LOGO")).toBeTruthy();

    const desktopNav = screen.getByTestId("desktop-nav");
    expect(within(desktopNav).getByTestId("nav-link-accueil")).toBeTruthy();
    expect(within(desktopNav).getByTestId("nav-link-dashboard")).toBeTruthy();
    /*     expect(within(desktopNav).getByTestId("nav-link-blog")).toBeTruthy();
     */
    expect(within(desktopNav).getByTestId("nav-link-contact")).toBeTruthy();

    expect(
      within(desktopNav).getByRole("button", { name: /login/i }),
    ).toBeTruthy();
  });

  it("toggles the mobile menu when clicking the hamburger button", () => {
    render(<Header />);

    const toggle = screen.getByTestId("menu-toggle");
    const mobileMenu = screen.getByTestId("mobile-menu");

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(mobileMenu.className).toContain("max-h-0");

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(mobileMenu.className).toContain("max-h-[500px]");
  });

  it("becomes sticky after scrolling past the offset", () => {
    render(<Header />);

    const nav = screen.getByTestId("header-nav");
    expect(nav.className).toContain("relative");

    Object.defineProperty(window, "scrollY", {
      value: 30,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(window);

    expect(nav.className).toContain("fixed");
  });
});
