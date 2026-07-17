import { describe, expect, it } from "vitest";
import { validateContact } from "../../app/lib/contact/contact";

const validData = {
  name: "Ada",
  email: "ada@example.com",
  phone: "0600000000",
  message: "Hello",
};

describe("validateContact", () => {
  it("succeeds with valid data", () => {
    expect(validateContact(validData)).toEqual({
      success: true,
      message: "Message envoyé avec succès.",
    });
  });

  it("requires a name", () => {
    const result = validateContact({ ...validData, name: "  " });
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toBeDefined();
  });

  it("requires an email", () => {
    const result = validateContact({ ...validData, email: "" });
    expect(result.fieldErrors?.email).toBe("L'adresse e-mail est requise.");
  });

  it("rejects a malformed email", () => {
    const result = validateContact({ ...validData, email: "not-an-email" });
    expect(result.fieldErrors?.email).toBe("L'adresse e-mail n'est pas valide.");
  });

  it("requires a message", () => {
    const result = validateContact({ ...validData, message: "   " });
    expect(result.fieldErrors?.message).toBeDefined();
  });
});
