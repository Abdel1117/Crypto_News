import { fetchJson } from "./fetchJson";

const API = process.env.NEXT_PUBLIC_API_BACK_END;

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatUsage {
  used: number;
  limit: number;
  remaining: number;
}

/** `GET /chat/usage` also says whether the server can reach the assistant. */
export interface ChatUsageResponse extends ChatUsage {
  available: boolean;
}

export interface ChatPortfolio {
  balance: number;
  initial_balance: number;
  realized_pnl: number;
  holdings: {
    coin_id: string;
    symbol: string;
    amount: number;
    avg_buy_price: number;
  }[];
}

export interface ChatRequestBody {
  messages: ChatTurn[];
  currency: "eur" | "usd";
  watchlist: string[];
  portfolio?: ChatPortfolio;
}

export type ChatEvent =
  | ({ type: "usage" } & ChatUsage)
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "error"; message: string }
  | { type: "done" };

/** Error returned by the chat endpoint before streaming starts (401, 429, 503…). */
export class ChatHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ChatHttpError";
  }
}

/**
 * Splits a Server-Sent Events buffer into complete events.
 * Returns the parsed events and the trailing incomplete chunk.
 */
export function parseSseBuffer(buffer: string): { events: ChatEvent[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const chunks = normalized.split("\n\n");
  const rest = chunks.pop() ?? "";
  const events: ChatEvent[] = [];

  for (const chunk of chunks) {
    const data = chunk
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      events.push(JSON.parse(data) as ChatEvent);
    } catch {
      // Ignore malformed events rather than breaking the whole answer.
    }
  }
  return { events, rest };
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.detail === "string") return data.detail;
  } catch {
    // Not JSON.
  }
  return `Erreur ${res.status}`;
}

/** Sends the conversation and calls `onEvent` for each streamed event. */
export async function streamChat(
  body: ChatRequestBody,
  token: string,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new ChatHttpError(res.status, await errorMessage(res));
  }
  if (!res.body) {
    throw new ChatHttpError(500, "Réponse vide du serveur.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSseBuffer(buffer);
    buffer = rest;
    events.forEach(onEvent);
  }

  buffer += decoder.decode();
  parseSseBuffer(buffer + "\n\n").events.forEach(onEvent);
}

export function getChatUsage(token: string): Promise<ChatUsageResponse> {
  return fetchJson<ChatUsageResponse>(`${API}/chat/usage`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
