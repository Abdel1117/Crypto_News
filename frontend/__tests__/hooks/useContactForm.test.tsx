import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../app/lib/contact/api", () => ({
  sendContactForm: vi.fn(),
}));

import { sendContactForm } from "../../app/lib/contact/api";
import { useContactForm } from "../../app/hooks/useContactForm";

describe("useContactForm", () => {
  beforeEach(() => {
    vi.mocked(sendContactForm).mockReset();
  });

  it("updates a field and clears its error on change", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.onChange("name")({
        target: { value: "Ada" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.fields.name).toBe("Ada");
  });

  it("reports field errors without calling the api when invalid", async () => {
    const { result } = renderHook(() => useContactForm());

    await act(async () => {
      await result.current.submit();
    });

    expect(sendContactForm).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.name).toBeDefined();
    expect(result.current.sent).toBe(false);
  });

  it("submits successfully with valid data", async () => {
    vi.mocked(sendContactForm).mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.onChange("name")({ target: { value: "Ada" } } as any);
      result.current.onChange("email")({ target: { value: "ada@example.com" } } as any);
      result.current.onChange("message")({ target: { value: "Hello" } } as any);
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(sendContactForm).toHaveBeenCalled();
    expect(result.current.sent).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("reports a failure message when the api call rejects", async () => {
    vi.mocked(sendContactForm).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.onChange("name")({ target: { value: "Ada" } } as any);
      result.current.onChange("email")({ target: { value: "ada@example.com" } } as any);
      result.current.onChange("message")({ target: { value: "Hello" } } as any);
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.sent).toBe(false);
  });

  it("resets the form", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.onChange("name")({ target: { value: "Ada" } } as any);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.fields.name).toBe("");
  });
});
