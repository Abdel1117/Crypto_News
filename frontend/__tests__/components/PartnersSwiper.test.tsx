import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));
vi.mock("swiper/react", () => ({
  Swiper: ({ children, "aria-label": ariaLabel }: any) => (
    <div aria-label={ariaLabel}>{children}</div>
  ),
  SwiperSlide: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("swiper/modules", () => ({ Autoplay: {}, FreeMode: {} }));
vi.mock("@/public/images/partners/01.png", () => ({ default: "/01.png" }));
vi.mock("@/public/images/partners/02.png", () => ({ default: "/02.png" }));
vi.mock("@/public/images/partners/03.png", () => ({ default: "/03.png" }));
vi.mock("@/public/images/partners/04.png", () => ({ default: "/04.png" }));
vi.mock("@/public/images/partners/05.png", () => ({ default: "/05.png" }));
vi.mock("@/public/images/partners/06.png", () => ({ default: "/06.png" }));

import PartnersSwiper from "../../app/components/PartnersSwiper/PartnersSwiper";

describe("PartnersSwiper", () => {
  it("renders the carousel with all partner logos tripled", () => {
    render(<PartnersSwiper />);

    expect(screen.getByLabelText("Partners carousel")).toBeTruthy();
    expect(screen.getAllByAltText("Partner logo 01").length).toBe(3);
    expect(screen.getAllByAltText("Partner logo 06").length).toBe(3);
  });
});
