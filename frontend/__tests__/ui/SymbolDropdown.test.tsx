import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority, ...props }: any) => (
    <img src={typeof src === "string" ? src : "img"} alt={alt} {...props} />
  ),
}));

import SymbolDropdown from "../../app/ui/SymbolDropdown/SymbolDropdown";

const options = [
  { id: "btc", symbol: "btc", name: "Bitcoin" },
  { id: "eth", symbol: "eth", name: "Ethereum", image: "/eth.png" },
];

describe("SymbolDropdown", () => {
  it("renders a placeholder option and the provided options", () => {
    render(<SymbolDropdown options={options} value={undefined} onChange={() => {}} />);

    expect(screen.getByText("Veuillez selectioner une crypto ...")).toBeTruthy();
    expect(screen.getByText("Bitcoin (BTC)")).toBeTruthy();
    expect(screen.getByText("Ethereum (ETH)")).toBeTruthy();
  });

  it("renders the optional label and calls onChange on selection", () => {
    const onChange = vi.fn();
    render(
      <SymbolDropdown options={options} value="btc" onChange={onChange} label="Crypto" />,
    );

    expect(screen.getByText("Crypto")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "eth" } });
    expect(onChange).toHaveBeenCalledWith("eth");
  });

  it("disables the select when disabled is true", () => {
    render(<SymbolDropdown options={options} value="btc" onChange={() => {}} disabled />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
  });
});
