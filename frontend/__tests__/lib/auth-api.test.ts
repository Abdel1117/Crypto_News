import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../app/lib/api/fetchJson", () => ({
  fetchJson: vi.fn(),
}));

import { fetchJson } from "../../app/lib/api/fetchJson";
import {
  loginWithGoogle,
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../../app/lib/auth/api";

describe("auth api", () => {
  beforeEach(() => {
    vi.mocked(fetchJson).mockReset();
  });

  it("posts google credentials", async () => {
    vi.mocked(fetchJson).mockResolvedValue({ access_token: "t" });

    await loginWithGoogle("cred-123");

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining("/auth/google"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ credentials: "cred-123" }),
      }),
    );
  });

  it("registers a user", async () => {
    vi.mocked(fetchJson).mockResolvedValue({ message: "ok" });
    const payload = { fullname: "Ada", email: "a@b.com", password: "secret123" };

    await registerUser(payload);

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining("/auth/register"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    );
  });

  it("logs a user in with credentials included", async () => {
    vi.mocked(fetchJson).mockResolvedValue({ access_token: "t" });
    const payload = { email: "a@b.com", password: "secret123" };

    await loginUser(payload);

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("refreshes the access token", async () => {
    vi.mocked(fetchJson).mockResolvedValue({ access_token: "t" });

    await refreshAccessToken();

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining("/auth/refresh"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("logs the user out", async () => {
    vi.mocked(fetchJson).mockResolvedValue(undefined);

    await logoutUser();

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining("/auth/logout"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
