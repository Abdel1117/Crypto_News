import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "../../store";
import {
  ChatHttpError,
  getChatUsage,
  streamChat,
  type ChatEvent,
  type ChatPortfolio,
  type ChatTurn,
} from "../../api/chat";
import { refreshSession } from "../auth/authThunks";
import {
  assistantDelta,
  availabilityChanged,
  messageSent,
  streamFailed,
  streamFinished,
  toolStarted,
  usageReceived,
  type ChatMessage,
} from "./chatSlice";

type ThunkApi = { state: RootState; dispatch: AppDispatch };

const TOKEN_MARGIN_MS = 30_000;

export const CHAT_ERRORS = {
  session: "Ta session a expiré. Reconnecte-toi pour continuer.",
  network: "Connexion à l'assistant impossible. Vérifie ta connexion et réessaie.",
  interrupted: "La réponse a été interrompue. Réessaie.",
};

let nextId = 0;
const newId = () => `${Date.now()}-${nextId++}`;

/**
 * The conversation as sent to the model: error notices are left out, and so is
 * any question whose answer failed (it would otherwise be merged into the next one).
 */
export function historyForModel(messages: ChatMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  messages.forEach((msg, i) => {
    if (msg.error || !msg.content.trim()) return;
    if (msg.role === "user" && messages[i + 1]?.error) return;
    turns.push({ role: msg.role, content: msg.content });
  });
  return turns;
}

export function portfolioForModel(state: RootState): ChatPortfolio | undefined {
  const sim = state.simulation;
  const untouched = sim.holdings.length === 0 && sim.trades.length === 0;
  if (untouched) return undefined;
  return {
    balance: sim.balance,
    initial_balance: sim.initialBalance,
    realized_pnl: sim.realizedPnl,
    holdings: sim.holdings.map((h) => ({
      coin_id: h.coinId,
      symbol: h.coinSymbol,
      amount: h.amount,
      avg_buy_price: h.avgBuyPrice,
    })),
  };
}

async function getToken(
  dispatch: AppDispatch,
  getState: () => RootState,
  force = false,
): Promise<string | null> {
  const { accessToken, expiresAt } = getState().auth;
  const fresh = accessToken && expiresAt && expiresAt - Date.now() > TOKEN_MARGIN_MS;
  if (fresh && !force) return accessToken;
  try {
    const tokens = await dispatch(refreshSession()).unwrap();
    return tokens.access_token;
  } catch {
    return null;
  }
}

export const fetchChatUsage = createAsyncThunk<void, void, ThunkApi>(
  "chat/fetchUsage",
  async (_, { dispatch, getState }) => {
    const token = await getToken(dispatch, getState);
    if (!token) return;
    try {
      const usage = await getChatUsage(token);
      dispatch(availabilityChanged(usage.available === false ? "unavailable" : "available"));
      // A message sent meanwhile already brought a fresher count: keep it.
      if (getState().chat.usage === null) dispatch(usageReceived(usage));
    } catch {
      dispatch(availabilityChanged("unreachable"));
    }
  },
);

export const sendChatMessage = createAsyncThunk<
  void,
  { text: string; currency: "eur" | "usd" },
  ThunkApi
>("chat/send", async ({ text, currency }, { dispatch, getState }) => {
  const state = getState();
  const question = text.trim();
  if (!question || state.chat.status === "streaming") return;

  const messages = [
    ...historyForModel(state.chat.messages),
    { role: "user" as const, content: question },
  ];
  const body = {
    messages,
    currency,
    watchlist: state.watchlist.ids,
    portfolio: portfolioForModel(state),
  };
  dispatch(messageSent({ id: newId(), text: question }));

  let finished = false;
  const onEvent = (event: ChatEvent) => {
    switch (event.type) {
      case "usage":
        dispatch(availabilityChanged("available"));
        dispatch(usageReceived(event));
        break;
      case "text":
        dispatch(assistantDelta(event.text));
        break;
      case "tool":
        dispatch(toolStarted(event.name));
        break;
      case "error":
        finished = true;
        dispatch(streamFailed(event.message));
        break;
      case "done":
        finished = true;
        dispatch(streamFinished());
        break;
    }
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(dispatch, getState, attempt > 0);
    if (!token) {
      dispatch(streamFailed(CHAT_ERRORS.session));
      return;
    }
    try {
      await streamChat(body, token, onEvent);
      if (!finished) dispatch(streamFailed(CHAT_ERRORS.interrupted));
      return;
    } catch (err) {
      if (err instanceof ChatHttpError) {
        if (err.status === 401 && attempt === 0) continue; // token rejected: refresh once
        if (err.status === 503) dispatch(availabilityChanged("unavailable"));
        if (err.status === 429) {
          const limit = getState().chat.usage?.limit ?? 0;
          dispatch(usageReceived({ used: limit, limit, remaining: 0 }));
        }
        dispatch(streamFailed(err.status === 401 ? CHAT_ERRORS.session : err.message));
        return;
      }
      // A connection drop after the final event changes nothing for the user.
      if (!finished) {
        dispatch(availabilityChanged("unreachable"));
        dispatch(streamFailed(CHAT_ERRORS.network));
      }
      return;
    }
  }
});
