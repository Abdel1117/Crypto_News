import { describe, expect, it } from "vitest";
import chatReducer, {
  assistantDelta,
  availabilityChanged,
  conversationCleared,
  messageSent,
  setChatOpen,
  streamFailed,
  streamFinished,
  toolStarted,
  usageReceived,
  type ChatState,
} from "@/app/lib/features/chat/chatSlice";

const initial = () => chatReducer(undefined, { type: "@@INIT" });

function streaming(): ChatState {
  return chatReducer(initial(), messageSent({ id: "1", text: "Prix du BTC ?" }));
}

describe("chatSlice", () => {
  it("starts closed and empty", () => {
    expect(initial()).toEqual({
      isOpen: false,
      messages: [],
      status: "idle",
      activeTool: null,
      usage: null,
      availability: "unknown",
    });
  });

  it("tracks whether the assistant is reachable", () => {
    expect(chatReducer(initial(), availabilityChanged("unreachable")).availability).toBe(
      "unreachable",
    );
  });

  it("keeps only the counter fields of the usage", () => {
    const usage = { used: 1, limit: 30, remaining: 29, available: true };
    expect(chatReducer(initial(), usageReceived(usage)).usage).toEqual({
      used: 1,
      limit: 30,
      remaining: 29,
    });
  });

  it("opens and closes", () => {
    expect(chatReducer(initial(), setChatOpen(true)).isOpen).toBe(true);
  });

  it("adds the question and an empty answer when a message is sent", () => {
    const state = streaming();
    expect(state.status).toBe("streaming");
    expect(state.messages).toEqual([
      { id: "1-u", role: "user", content: "Prix du BTC ?" },
      { id: "1-a", role: "assistant", content: "" },
    ]);
  });

  it("appends streamed text to the answer and clears the tool label", () => {
    let state = chatReducer(streaming(), toolStarted("get_coin"));
    expect(state.activeTool).toBe("get_coin");
    state = chatReducer(state, assistantDelta("100 "));
    state = chatReducer(state, assistantDelta("€"));
    expect(state.messages[1].content).toBe("100 €");
    expect(state.activeTool).toBeNull();
  });

  it("goes back to idle when the stream finishes", () => {
    const state = chatReducer(streaming(), streamFinished());
    expect(state.status).toBe("idle");
  });

  it("turns an empty answer into an error notice", () => {
    const state = chatReducer(streaming(), streamFailed("Oups"));
    expect(state.messages[1]).toMatchObject({ content: "Oups", error: true });
    expect(state.status).toBe("idle");
  });

  it("keeps a partial answer and adds the error after it", () => {
    let state = chatReducer(streaming(), assistantDelta("Le BTC"));
    state = chatReducer(state, streamFailed("Interrompu"));
    expect(state.messages).toHaveLength(3);
    expect(state.messages[1]).toMatchObject({ content: "Le BTC" });
    expect(state.messages[1].error).toBeUndefined();
    expect(state.messages[2]).toMatchObject({ content: "Interrompu", error: true });
  });

  it("stores the usage", () => {
    const usage = { used: 1, limit: 30, remaining: 29 };
    expect(chatReducer(initial(), usageReceived(usage)).usage).toEqual(usage);
  });

  it("clears the conversation, but not while streaming", () => {
    expect(chatReducer(streaming(), conversationCleared()).messages).toHaveLength(2);
    const done = chatReducer(streaming(), streamFinished());
    expect(chatReducer(done, conversationCleared()).messages).toEqual([]);
  });
});
