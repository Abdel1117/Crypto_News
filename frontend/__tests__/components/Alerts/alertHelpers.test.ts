import { describe, expect, it } from "vitest";
import {
  alertBlocker,
  describeInterval,
  describeRule,
  formatAlertPrice,
  toApiThreshold,
} from "@/app/components/Alerts/alertHelpers";

// French number formatting uses non-breaking spaces: compare with plain ones.
const plain = (text: string) => text.replace(/[  ]/g, " ");

const blocker = (overrides = {}) =>
  alertBlocker({
    hasCoin: true,
    thresholdText: "50000",
    direction: "below",
    price: 60000,
    ...overrides,
  });

describe("toApiThreshold", () => {
  it("keeps what was typed, with a dot as decimal separator", () => {
    expect(toApiThreshold("50000")).toBe("50000");
    expect(toApiThreshold("85 000,10")).toBe("85000.10");
    expect(toApiThreshold("85 000.5")).toBe("85000.5");
    expect(toApiThreshold("0,00001234")).toBe("0.00001234");
  });
});

describe("alertBlocker", () => {
  it("asks for a coin first", () => {
    expect(blocker({ hasCoin: false })).toBe("Cherche et choisis une crypto.");
  });

  it("says nothing while the threshold is empty", () => {
    expect(blocker({ thresholdText: "" })).toBeNull();
    expect(blocker({ thresholdText: "   " })).toBeNull();
  });

  it("accepts a threshold on the right side of the price", () => {
    expect(blocker()).toBeNull();
    expect(blocker({ thresholdText: "85000", direction: "above" })).toBeNull();
    expect(blocker({ thresholdText: "85 000,50", direction: "above" })).toBeNull();
  });

  it.each(["abc", "0", "-5", "1,2,3", "1.2.3", "."])("refuses %s", (thresholdText) => {
    expect(blocker({ thresholdText })).toBe("Seuil invalide.");
  });

  it("applies the API's limits", () => {
    expect(blocker({ thresholdText: "1000000000000000000" })).toBe("Seuil trop élevé.");
    expect(blocker({ thresholdText: "0.0000000000001", price: 0 })).toBe(
      "12 décimales au maximum.",
    );
    expect(blocker({ thresholdText: "999999999999999", direction: "above" })).toBeNull();
  });

  it("refuses a threshold the price has already reached", () => {
    expect(blocker({ thresholdText: "70000", direction: "below" })).toBe(
      "Le prix est déjà sous ce seuil.",
    );
    expect(blocker({ thresholdText: "60000", direction: "below" })).toBe(
      "Le prix est déjà sous ce seuil.",
    );
    expect(blocker({ thresholdText: "50000", direction: "above" })).toBe(
      "Le prix est déjà au-dessus de ce seuil.",
    );
    expect(blocker({ thresholdText: "60000", direction: "above" })).toBe(
      "Le prix est déjà au-dessus de ce seuil.",
    );
  });

  it("leaves the decision to the server when the price is unknown", () => {
    expect(blocker({ thresholdText: "70000", price: null })).toBeNull();
  });
});

describe("formatAlertPrice", () => {
  it.each([
    [50000, "eur", "50 000,00 €"],
    [85000, "usd", "85 000,00 $"],
    [85000.1, "eur", "85 000,10 €"],
    [1.2345, "usd", "1,2345 $"],
    [0.5, "eur", "0,5 €"],
    [0.00001234, "eur", "0,00001234 €"],
    [0.000000000001, "usd", "0,000000000001 $"],
  ] as const)("formats %s %s", (value, currency, expected) => {
    expect(plain(formatAlertPrice(value, currency))).toBe(expected);
  });

  it("hides float noise", () => {
    expect(plain(formatAlertPrice(1234567.12, "eur"))).toBe("1 234 567,12 €");
  });
});

describe("describeRule", () => {
  it("states the condition", () => {
    expect(plain(describeRule({ direction: "below", threshold: 50000, currency: "eur" }))).toBe(
      "Sous 50 000,00 €",
    );
    expect(plain(describeRule({ direction: "above", threshold: 85000, currency: "usd" }))).toBe(
      "Au-dessus de 85 000,00 $",
    );
  });
});

describe("describeInterval", () => {
  it("reads naturally", () => {
    expect(describeInterval(600)).toBe("toutes les 10 minutes");
    expect(describeInterval(300)).toBe("toutes les 5 minutes");
    expect(describeInterval(60)).toBe("chaque minute");
    expect(describeInterval(30)).toBe("chaque minute");
  });
});
