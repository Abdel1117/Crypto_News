import { afterEach, describe, expect, it } from "vitest";
import {
  loginHref,
  nextPathFromLocation,
  safeNextPath,
} from "@/app/lib/auth/redirect";

describe("safeNextPath", () => {
  it("accepts a path on this site", () => {
    expect(safeNextPath("?next=%2Fblog%2Fmon-article")).toBe("/blog/mon-article");
    expect(safeNextPath("?next=/blog?x=1")).toBe("/blog?x=1");
  });

  it.each([
    ["no parameter", ""],
    ["another site", "?next=https://evil.example"],
    ["protocol-relative", "?next=//evil.example"],
    ["backslash trick", "?next=/%5Cevil.example"],
    ["relative path", "?next=blog"],
    ["control characters", "?next=/blog%0Ahello"],
  ])("ignores %s", (_, search) => {
    expect(safeNextPath(search)).toBeNull();
  });
});

describe("loginHref", () => {
  it("round-trips through safeNextPath", () => {
    const href = loginHref("/blog/un-article");
    expect(href).toBe("/login?next=%2Fblog%2Fun-article");
    expect(safeNextPath(href.slice(href.indexOf("?")))).toBe("/blog/un-article");
  });
});

describe("nextPathFromLocation", () => {
  afterEach(() => {
    globalThis.history.replaceState(null, "", "/");
  });

  it("reads the current URL", () => {
    globalThis.history.replaceState(null, "", "/login?next=%2Fblog");
    expect(nextPathFromLocation()).toBe("/blog");
  });
});
