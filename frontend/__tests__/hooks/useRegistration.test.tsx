import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../app/lib/auth/api", () => ({
  registerUser: vi.fn(),
}));

import { registerUser } from "../../app/lib/auth/api";
import { useRegistration } from "../../app/hooks/useRegistration";

const validData = {
  fullname: "Ada Lovelace",
  email: "ada@example.com",
  password: "supersecret",
  confirmPassword: "supersecret",
};

describe("useRegistration", () => {
  beforeEach(() => {
    vi.mocked(registerUser).mockReset();
  });

  it("returns validation errors without calling the api", async () => {
    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.register({ ...validData, email: "" });
    });

    expect(registerUser).not.toHaveBeenCalled();
    expect(result.current.success).toBe(false);
  });

  it("registers successfully and stores the result", async () => {
    vi.mocked(registerUser).mockResolvedValue({ message: "Bienvenue !" });
    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.register(validData);
    });

    expect(registerUser).toHaveBeenCalledWith({
      fullname: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
    });
    expect(result.current.success).toBe(true);
    expect(result.current.message).toBe("Bienvenue !");
    expect(result.current.loading).toBe(false);
  });

  it("stores an error message when the api call fails", async () => {
    vi.mocked(registerUser).mockRejectedValue(new Error("Email déjà utilisé"));
    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.register(validData);
    });

    expect(result.current.success).toBe(false);
    expect(result.current.message).toBe("Email déjà utilisé");
  });
});
