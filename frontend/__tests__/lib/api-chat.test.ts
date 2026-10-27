import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ChatHttpError,
  getChatUsage,
  parseSseBuffer,
  streamChat,
  type ChatEvent,
} from "@/app/lib/api/chat";
import { jsonResponse, sse, sseResponse } from "./chatTestUtils";

const BODY = {
  messages: [{ role: "user" as const, content: "Prix du BTC ?" }],
  currency: "eur" as const,
  watchlist: ["bitcoin"],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseSseBuffer", () => {
  it("parses complete events and keeps the incomplete tail", () => {
    const { events, rest } = parseSseBuffer(
      `${sse({ type: "text", text: "a" })}${sse({ type: "done" })}data: {"type":"te`,
    );
    expect(events).toEqual([{ type: "text", text: "a" }, { type: "done" }]);
    expect(rest).toBe('data: {"type":"te');
  });

  it("handles CRLF line endings", () => {
    const { events } = parseSseBuffer('data: {"type":"done"}\r\n\r\n');
    expect(events).toEqual([{ type: "done" }]);
  });

  it("skips malformed and empty events", () => {
    const { events } = parseSseBuffer(`data: not-json\n\n: comment\n\n${sse({ type: "done" })}`);
    expect(events).toEqual([{ type: "done" }]);
  });
});

describe("streamChat", () => {
  it("sends the conversation with the bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([sse({ type: "done" })]));
    vi.stubGlobal("fetch", fetchMock);

    await streamChat(BODY, "tok", () => {});

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/chat$/);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual(BODY);
  });

  it("emits events split across network chunks", async () => {
    const full = sse({ type: "text", text: "Bon" }) + sse({ type: "text", text: "jour" }) + sse({ type: "done" });
    const chunks = [full.slice(0, 7), full.slice(7, 40), full.slice(40)];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse(chunks)));

    const events: ChatEvent[] = [];
    await streamChat(BODY, "tok", (e) => events.push(e));

    expect(events).toEqual([
      { type: "text", text: "Bon" },
      { type: "text", text: "jour" },
      { type: "done" },
    ]);
  });

  it("parses a last event without a trailing blank line", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse(['data: {"type":"done"}'])));
    const events: ChatEvent[] = [];
    await streamChat(BODY, "tok", (e) => events.push(e));
    expect(events).toEqual([{ type: "done" }]);
  });

  it("throws the server message on HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(429, { detail: "Limite atteinte" })),
    );
    const error = await streamChat(BODY, "tok", () => {}).catch((e) => e);
    expect(error).toBeInstanceOf(ChatHttpError);
    expect(error.status).toBe(429);
    expect(error.message).toBe("Limite atteinte");
  });
});

describe("getChatUsage", () => {
  it("fetches the usage with the bearer token", async () => {
    const usage = { used: 2, limit: 30, remaining: 28 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, usage));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getChatUsage("tok")).resolves.toEqual(usage);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/chat\/usage$/);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
  });
});
