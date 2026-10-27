import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChatRole, ChatUsage } from "../../api/chat";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Error notices are shown to the user but never sent back to the model. */
  error?: boolean;
}

/**
 * unknown: not checked yet. unavailable: the server has no assistant
 * configured. unreachable: the server could not be contacted.
 */
export type ChatAvailability = "unknown" | "available" | "unavailable" | "unreachable";

export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  status: "idle" | "streaming";
  activeTool: string | null;
  usage: ChatUsage | null;
  availability: ChatAvailability;
}

// Conversations live in memory only: they survive page changes, not a reload.
const initialState: ChatState = {
  isOpen: false,
  messages: [],
  status: "idle",
  activeTool: null,
  usage: null,
  availability: "unknown",
};

function lastAssistant(state: ChatState): ChatMessage | undefined {
  const last = state.messages[state.messages.length - 1];
  return last?.role === "assistant" ? last : undefined;
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
    },
    messageSent(state, action: PayloadAction<{ id: string; text: string }>) {
      const { id, text } = action.payload;
      state.messages.push({ id: `${id}-u`, role: "user", content: text });
      state.messages.push({ id: `${id}-a`, role: "assistant", content: "" });
      state.status = "streaming";
      state.activeTool = null;
    },
    assistantDelta(state, action: PayloadAction<string>) {
      const msg = lastAssistant(state);
      if (msg) msg.content += action.payload;
      state.activeTool = null;
    },
    toolStarted(state, action: PayloadAction<string>) {
      state.activeTool = action.payload;
    },
    usageReceived(state, action: PayloadAction<ChatUsage>) {
      const { used, limit, remaining } = action.payload;
      state.usage = { used, limit, remaining };
    },
    availabilityChanged(state, action: PayloadAction<ChatAvailability>) {
      state.availability = action.payload;
    },
    streamFinished(state) {
      state.status = "idle";
      state.activeTool = null;
    },
    streamFailed(state, action: PayloadAction<string>) {
      const msg = lastAssistant(state);
      if (msg && msg.content.trim() === "") {
        msg.content = action.payload;
        msg.error = true;
      } else {
        state.messages.push({
          id: `err-${state.messages.length}`,
          role: "assistant",
          content: action.payload,
          error: true,
        });
      }
      state.status = "idle";
      state.activeTool = null;
    },
    conversationCleared(state) {
      if (state.status === "streaming") return;
      state.messages = [];
    },
  },
});

export const {
  setChatOpen,
  messageSent,
  assistantDelta,
  toolStarted,
  usageReceived,
  availabilityChanged,
  streamFinished,
  streamFailed,
  conversationCleared,
} = chatSlice.actions;
export default chatSlice.reducer;
