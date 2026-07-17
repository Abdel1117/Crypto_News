import { describe, expect, it } from "vitest";
import { validateRegistration } from "../../app/lib/auth/registration";

const validData = {
  fullname: "Ada Lovelace",
  email: "Ada@Example.com",
  password: "supersecret",
  confirmPassword: "supersecret",
};

describe("validateRegistration", () => {
  it("succeeds and normalizes the payload", () => {
    const result = validateRegistration(validData);
    expect(result.success).toBe(true);
    expect(result.payload).toEqual({
      fullname: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
    });
  });

  it("requires a full name", () => {
    const result = validateRegistration({ ...validData, fullname: "  " });
    expect(result.fieldErrors?.fullname).toBeDefined();
  });

  it("requires an email", () => {
    const result = validateRegistration({ ...validData, email: "" });
    expect(result.fieldErrors?.email).toBe("Veuillez remplir l'adresse e-mail.");
  });

  it("rejects a malformed email", () => {
    const result = validateRegistration({ ...validData, email: "bad" });
    expect(result.fieldErrors?.email).toBe("Merci d’indiquer une adresse e-mail valide.");
  });

  it("requires a password", () => {
    const result = validateRegistration({ ...validData, password: "", confirmPassword: "" });
    expect(result.fieldErrors?.password).toBeDefined();
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = validateRegistration({ ...validData, password: "short", confirmPassword: "short" });
    expect(result.fieldErrors?.password).toBe(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  });

  it("requires password confirmation", () => {
    const result = validateRegistration({ ...validData, confirmPassword: "" });
    expect(result.fieldErrors?.confirmPassword).toBeDefined();
  });

  it("rejects mismatched passwords", () => {
    const result = validateRegistration({ ...validData, confirmPassword: "different" });
    expect(result.fieldErrors?.confirmPassword).toBe("Les mots de passe ne correspondent pas.");
  });
});
