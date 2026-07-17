import { describe, expect, it, afterEach } from "vitest";
import { getCssVar } from "../../app/utils/StyleFunctions/GetCssVar";

describe("getCssVar", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("returns the trimmed value of a CSS custom property set on the root element", () => {
    document.documentElement.style.setProperty("--primary-color", "  #ff0000  ");

    expect(getCssVar("--primary-color")).toBe("#ff0000");
  });

  it("returns an empty string when the property is not defined", () => {
    expect(getCssVar("--not-defined")).toBe("");
  });
});
