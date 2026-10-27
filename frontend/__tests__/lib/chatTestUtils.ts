import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/app/lib/features/auth/authSlice";
import chatReducer, { type ChatState } from "@/app/lib/features/chat/chatSlice";
import watchlistReducer from "@/app/lib/features/watchlist/watchlistSlice";
import simulationReducer from "@/app/lib/features/simulation/simulationSlice";
import type { AppDispatch } from "@/app/lib/store";

/** A fetch Response whose body streams the given text chunks. */
export function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () =>
          i < chunks.length
            ? { value: encoder.encode(chunks[i++]), done: false }
            : { value: undefined, done: true },
      }),
    },
  } as unknown as Response;
}

export function jsonResponse(status: number, data: unknown) {
  const text = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    body: null,
    json: async () => data,
    text: async () => text,
  } as unknown as Response;
}

export const sse = (event: unknown) => `data: ${JSON.stringify(event)}\n\n`;

export function makeChatStore(
  options: { loggedIn?: boolean; chat?: Partial<ChatState>; watchlist?: string[] } = {},
) {
  const { loggedIn = true, chat, watchlist = [] } = options;
  const store = configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      watchlist: watchlistReducer,
      simulation: simulationReducer,
    },
    preloadedState: {
      auth: {
        user: loggedIn ? { id: "1", email: "t@example.com", fullName: "Test" } : null,
        accessToken: loggedIn ? "token-1" : null,
        expiresAt: loggedIn ? Date.now() + 3_600_000 : null,
        isAuthenticated: loggedIn,
        initializing: false,
      },
      chat: {
        isOpen: false,
        messages: [],
        status: "idle" as const,
        activeTool: null,
        usage: null,
        availability: "unknown" as const,
        ...chat,
      },
      watchlist: { ids: watchlist },
    },
  });
  // The thunks are typed against the full app state; this store holds the
  // slices they read.
  return Object.assign(store, { dispatch: store.dispatch as AppDispatch });
}
