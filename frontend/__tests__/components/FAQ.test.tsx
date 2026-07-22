import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { faqData } from "../../app/components/FAQ/faqData";
import { FAQList } from "../../app/components/FAQ/FAQList";
import { FAQItem } from "../../app/components/FAQ/FAQItem";
import { FAQ } from "../../app/components/FAQ/FAQ";

describe("faqData", () => {
  it("contains at least one question with an id, question and answer", () => {
    expect(faqData.length).toBeGreaterThan(0);
    for (const item of faqData) {
      expect(item.id).toBeTruthy();
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    }
  });
});

describe("FAQItem", () => {
  it("calls onToggle with its id when clicked", () => {
    const onToggle = vi.fn();
    render(
      <FAQItem data={{ id: "1", question: "Q?", answer: "A." }} isOpen={false} onToggle={onToggle} />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("reflects the open state via aria-expanded", () => {
    render(<FAQItem data={{ id: "1", question: "Q?", answer: "A." }} isOpen onToggle={() => {}} />);
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  });
});

describe("FAQList", () => {
  it("shows a placeholder when there are no items", () => {
    render(<FAQList items={[]} />);
    expect(screen.getByText(/Aucune question disponible/)).toBeTruthy();
  });

  it("opens only one item at a time", () => {
    const items = [
      { id: "1", question: "Q1?", answer: "A1" },
      { id: "2", question: "Q2?", answer: "A2" },
    ];
    render(<FAQList items={items} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(buttons[1]);
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute("aria-expanded")).toBe("false");
  });
});

describe("FAQ", () => {
  it("renders the heading and the questions", () => {
    render(<FAQ />);
    expect(screen.getByText("Questions Fréquentes")).toBeTruthy();
    expect(screen.getByText(faqData[0].question)).toBeTruthy();
  });
});
