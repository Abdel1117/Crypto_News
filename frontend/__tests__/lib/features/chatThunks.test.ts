import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_ERRORS,
  fetchChatUsage,
  historyForModel,
  portfolioForModel,
  sendChatMessage,
} from "@/app/lib/features/chat/chatThunks";
import type { ChatMessage } from "@/app/lib/features/chat/chatSlice";
import type { RootState } from "@/app/lib/store";
import { jsonResponse, makeChatStore, sse, sseResponse } from "../chatTestUtils";

afterEach(() => {
  vi.unstubAllGlobals();
});

const USAGE = { type: "usage", used: 1, limit: 30, remaining: 29 };

function requestBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body);
}

describe("historyForModel", () => {
  it("drops error notices and the questions they answered", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "q1" },
      { id: "2", role: "assistant", content: "a1" },
      { id: "3", role: "user", content: "q2" },
      { id: "4", role: "assistant", content: "Erreur", error: true },
      { id: "5", role: "user", content: "q3" },
      { id: "6", role: "assistant", content: "" },
    ];
    expect(historyForModel(messages)).toEqual([
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "q3" },
    ]);
  });
});

describe("portfolioForModel", () => {
  it("is omitted for an untouched simulation", () => {
    const store = makeChatStore();
    expect(portfolioForModel(store.getState() as RootState)).toBeUndefined();
  });

  it("maps holdings to the API shape", () => {
    const store = makeChatStore();
    const state = store.getState() as RootState;
    const withHolding = {
      ...state,
      simulation: {
        ...state.simulation,
        balance: 9700,
        holdings: [
          { coinId: "solana", coinName: "Solana", coinSymbol: "SOL", coinImage: "", amount: 2, avgBuyPrice: 150 },
        ],
      },
    };
    expect(portfolioForModel(withHolding)).toEqual({
      balance: 9700,
      initial_balance: 10000,
      realized_pnl: 0,
      holdings: [{ coin_id: "solana", symbol: "SOL", amount: 2, avg_buy_price: 150 }],
    });
  });
});

describe("sendChatMessage", () => {
  it("streams the answer into the conversation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        sse(USAGE),
        sse({ type: "tool", name: "get_coin" }),
        sse({ type: "text", text: "Le BTC vaut " }),
        sse({ type: "text", text: "100 €." }),
        sse({ type: "done" }),
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const store = makeChatStore({ watchlist: ["bitcoin"] });

    await store.dispatch(sendChatMessage({ text: " Prix du BTC ? ", currency: "usd" }));

    const { chat } = store.getState();
    expect(chat.status).toBe("idle");
    expect(chat.usage).toEqual({ used: 1, limit: 30, remaining: 29 });
    expect(chat.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "Prix du BTC ?"],
      ["assistant", "Le BTC vaut 100 €."],
    ]);
    expect(requestBody(fetchMock)).toEqual({
      messages: [{ role: "user", content: "Prix du BTC ?" }],
      currency: "usd",
      watchlist: ["bitcoin"],
    });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token-1");
  });

  it("sends the previous turns as history", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([sse({ type: "done" })]));
    vi.stubGlobal("fetch", fetchMock);
    const store = makeChatStore({
      chat: {
        messages: [
          { id: "1", role: "user", content: "q1" },
          { id: "2", role: "assistant", content: "a1" },
        ],
      },
    });

    await store.dispatch(sendChatMessage({ text: "q2", currency: "eur" }));

    expect(requestBody(fetchMock).messages).toEqual([
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "q2" },
    ]);
  });

  it("ignores empty messages and messages sent while streaming", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const store = makeChatStore({ chat: { status: "streaming" } });

    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));
    await makeChatStore().dispatch(sendChatMessage({ text: "   ", currency: "eur" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server error from the stream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sseResponse([sse({ type: "error", message: "Indisponible" })])),
    );
    const store = makeChatStore();
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    const last = store.getState().chat.messages.at(-1);
    expect(last).toMatchObject({ content: "Indisponible", error: true });
  });

  it("shows the daily limit message and sets remaining to zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(429, { detail: "Limite atteinte" })),
    );
    const store = makeChatStore({ chat: { usage: { used: 29, limit: 30, remaining: 1 } } });
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    const { chat } = store.getState();
    expect(chat.messages.at(-1)).toMatchObject({ content: "Limite atteinte", error: true });
    expect(chat.usage).toEqual({ used: 30, limit: 30, remaining: 0 });
  });

  it("refreshes the token once when it is rejected", async () => {
    let chatAttempts = 0;
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, { access_token: "token-2", expires_in: 900 });
      }
      chatAttempts += 1;
      return chatAttempts === 1
        ? jsonResponse(401, { detail: "Token invalide" })
        : sseResponse([sse({ type: "text", text: "ok" }), sse({ type: "done" })]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = makeChatStore();

    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    const chatCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/chat"));
    expect(chatCalls).toHaveLength(2);
    const headers = chatCalls[1][1]!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-2");
    expect(store.getState().chat.messages.at(-1)).toMatchObject({ content: "ok" });
  });

  it("asks to log in again when the session cannot be refreshed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { detail: "no" })));
    const store = makeChatStore();
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    expect(store.getState().chat.messages.at(-1)).toMatchObject({
      content: CHAT_ERRORS.session,
      error: true,
    });
  });

  it("reports a stream that ends without a final event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sseResponse([sse({ type: "text", text: "Le BTC" })])),
    );
    const store = makeChatStore();
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    const { messages, status } = store.getState().chat;
    expect(status).toBe("idle");
    expect(messages.at(-2)).toMatchObject({ content: "Le BTC" });
    expect(messages.at(-1)).toMatchObject({ content: CHAT_ERRORS.interrupted, error: true });
  });

  it("reports a network failure and marks the assistant unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const store = makeChatStore();
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    expect(store.getState().chat.messages.at(-1)).toMatchObject({
      content: CHAT_ERRORS.network,
      error: true,
    });
    expect(store.getState().chat.availability).toBe("unreachable");
  });

  it("marks the assistant unavailable when the server is not configured", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(503, { detail: "L'assistant n'est pas configuré." })),
    );
    const store = makeChatStore();
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));

    expect(store.getState().chat.availability).toBe("unavailable");
    expect(store.getState().chat.messages.at(-1)).toMatchObject({
      content: "L'assistant n'est pas configuré.",
      error: true,
    });
  });

  it("marks the assistant available once an answer starts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sseResponse([sse(USAGE), sse({ type: "done" })])));
    const store = makeChatStore({ chat: { availability: "unreachable" } });
    await store.dispatch(sendChatMessage({ text: "q", currency: "eur" }));
    expect(store.getState().chat.availability).toBe("available");
  });
});

describe("fetchChatUsage", () => {
  it("stores the remaining messages and marks the assistant available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { used: 3, limit: 30, remaining: 27, available: true }),
      ),
    );
    const store = makeChatStore();
    await store.dispatch(fetchChatUsage());
    expect(store.getState().chat.usage).toEqual({ used: 3, limit: 30, remaining: 27 });
    expect(store.getState().chat.availability).toBe("available");
  });

  it("marks the assistant unavailable when the server has no API key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { used: 0, limit: 30, remaining: 30, available: false }),
      ),
    );
    const store = makeChatStore();
    await store.dispatch(fetchChatUsage());
    expect(store.getState().chat.availability).toBe("unavailable");
  });

  it("marks the assistant unreachable when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const store = makeChatStore();
    await store.dispatch(fetchChatUsage());
    expect(store.getState().chat.usage).toBeNull();
    expect(store.getState().chat.availability).toBe("unreachable");
  });
});
