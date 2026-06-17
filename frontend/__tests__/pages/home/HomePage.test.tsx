import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Static asset mocks ───────────────────────────────────────────────────────

vi.mock("@/public/images/01.png", () => ({ default: "/images/01.png" }));
vi.mock("@/public/images/02.png", () => ({ default: "/images/02.png" }));

// ─── Component mocks ──────────────────────────────────────────────────────────

vi.mock("../../../app/components/Hero/Hero", () => ({
  default: () => <section data-testid="section-hero">Hero</section>,
}));

vi.mock("../../../app/components/BlockCTA/BlockCTA", () => ({
  default: () => <section data-testid="section-block-cta">BlockCTA</section>,
}));

vi.mock("../../../app/components/ProductDescription/ProductDescription", () => ({
  default: () => (
    <section data-testid="section-product-description">
      ProductDescription
    </section>
  ),
}));

vi.mock("../../../app/components/TeamMembers/TeamMember", () => ({
  default: () => (
    <section data-testid="section-team-member">TeamMember</section>
  ),
}));

vi.mock("../../../app/components/Partners/Partners", () => ({
  default: () => <section data-testid="section-partners">Partners</section>,
}));

vi.mock("../../../app/components/PartnersSwiper/PartnersSwiper", () => ({
  default: () => (
    <section data-testid="section-partners-swiper">PartnersSwiper</section>
  ),
}));

vi.mock("../../../app/components/ContactForm/ContactForm", () => ({
  ContactForm: () => (
    <section data-testid="section-contact-form">ContactForm</section>
  ),
}));

vi.mock("../../../app/components/FAQ/FAQ", () => ({
  FAQ: () => <section data-testid="section-faq">FAQ</section>,
}));

vi.mock("../../../app/components/RoadMap/RoadMap", () => ({
  default: () => <section data-testid="section-road-map">RoadMap</section>,
}));

import Home from "../../../app/(public)/page";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Home page", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<Home />);
      expect(container.firstChild).toBeTruthy();
    });

    it("renders all 9 sections", () => {
      render(<Home />);
      expect(screen.getByTestId("section-hero")).toBeTruthy();
      expect(screen.getByTestId("section-partners-swiper")).toBeTruthy();
      expect(screen.getByTestId("section-product-description")).toBeTruthy();
      expect(screen.getByTestId("section-road-map")).toBeTruthy();
      expect(screen.getByTestId("section-team-member")).toBeTruthy();
      expect(screen.getByTestId("section-partners")).toBeTruthy();
      expect(screen.getByTestId("section-faq")).toBeTruthy();
      expect(screen.getByTestId("section-contact-form")).toBeTruthy();
    });
  });

  describe("Hero section", () => {
    it("renders the Hero component", () => {
      render(<Home />);
      expect(screen.getByTestId("section-hero")).toBeTruthy();
    });
  });

  describe("BlockCTA sections", () => {
    it("renders exactly two BlockCTA sections", () => {
      render(<Home />);
      const ctas = screen.getAllByTestId("section-block-cta");
      expect(ctas.length).toBe(2);
    });
  });

  describe("Partners sections", () => {
    it("renders the PartnersSwiper carousel", () => {
      render(<Home />);
      expect(screen.getByTestId("section-partners-swiper")).toBeTruthy();
    });

    it("renders the Partners static section", () => {
      render(<Home />);
      expect(screen.getByTestId("section-partners")).toBeTruthy();
    });
  });

  describe("Content sections", () => {
    it("renders the ProductDescription section", () => {
      render(<Home />);
      expect(screen.getByTestId("section-product-description")).toBeTruthy();
    });

    it("renders the RoadMap section", () => {
      render(<Home />);
      expect(screen.getByTestId("section-road-map")).toBeTruthy();
    });

    it("renders the TeamMember section", () => {
      render(<Home />);
      expect(screen.getByTestId("section-team-member")).toBeTruthy();
    });
  });

  describe("Conversion sections", () => {
    it("renders the FAQ section", () => {
      render(<Home />);
      expect(screen.getByTestId("section-faq")).toBeTruthy();
    });

    it("renders the ContactForm section", () => {
      render(<Home />);
      expect(screen.getByTestId("section-contact-form")).toBeTruthy();
    });
  });
});
