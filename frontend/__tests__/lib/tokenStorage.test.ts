import { describe, expect, it, beforeEach } from "vitest";
import { tokenStorage } from "../../app/lib/auth/tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it("stores and retrieves the access token", () => {
    tokenStorage.setAccessToken("abc123");
    expect(tokenStorage.getAccessToken()).toBe("abc123");
  });

  it("clears the stored token", () => {
    tokenStorage.setAccessToken("abc123");
    tokenStorage.clearTokens();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
