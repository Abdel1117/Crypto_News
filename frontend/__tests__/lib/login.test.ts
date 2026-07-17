import { describe, expect, it } from "vitest";
import { validateLogin } from "../../app/lib/auth/login";

describe("validateLogin", () => {
  it("succeeds and normalizes the email", () => {
    const result = validateLogin({ email: "  Ada@Example.com  ", password: "secret" });
    expect(result.success).toBe(true);
    expect(result.payload).toEqual({ email: "ada@example.com", password: "secret" });
  });

  it("requires an email", () => {
    const result = validateLogin({ email: "  ", password: "secret" });
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.email).toBeDefined();
  });

  it("requires a password", () => {
    const result = validateLogin({ email: "a@b.com", password: "  " });
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toBeDefined();
  });
});
