import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../app/lib/api/fetchJson", () => ({
  fetchJson: vi.fn(),
}));

import { fetchJson } from "../../app/lib/api/fetchJson";
import { sendContactForm } from "../../app/lib/contact/api";

describe("sendContactForm", () => {
  beforeEach(() => {
    vi.mocked(fetchJson).mockReset();
  });

  it("posts the contact payload as JSON", async () => {
    vi.mocked(fetchJson).mockResolvedValue({ ok: true });
    const payload = { name: "Ada", email: "a@b.com", phone: "0600000000", message: "Hi" };

    await sendContactForm(payload);

    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining("/contact/send"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });
});
