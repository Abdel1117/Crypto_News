"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { conversationCleared, type ChatMessage } from "@/app/lib/features/chat/chatSlice";
import { fetchChatUsage, sendChatMessage } from "@/app/lib/features/chat/chatThunks";
import {
  ArrowCounterClockwiseIcon,
  CloseIcon,
  PaperPlaneIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import ChatMarkdown from "./ChatMarkdown";

export const SUGGESTIONS = [
  "Fais-moi un briefing de ma watchlist",
  "Quelles sont les plus fortes hausses du jour ?",
  "Comment se porte le marché aujourd'hui ?",
];

export const TOOL_LABELS: Record<string, string> = {
  search_coin: "Recherche de la crypto…",
  get_coin: "Consultation du cours…",
  get_top_markets: "Consultation du classement…",
  get_top_movers: "Analyse des plus fortes variations…",
  get_global_market: "Analyse du marché global…",
  get_price_history: "Lecture de l'historique des prix…",
  get_trending: "Consultation des tendances…",
};

const MAX_INPUT = 2000;

export const AVAILABILITY_NOTICES = {
  unavailable: "L'assistant n'est pas disponible pour le moment. Réessaie plus tard.",
  unreachable: "Impossible de joindre l'assistant. Vérifie ta connexion.",
};

function TypingDots() {
  return (
    <span className="n-chat-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Bubble({ message, pending }: { message: ChatMessage; pending: boolean }) {
  if (message.role === "user") {
    return (
      <div className="self-end max-w-[85%] px-3 py-2 rounded-2xl rounded-br-md whitespace-pre-wrap wrap-break-word bg-[color-mix(in_srgb,var(--n-accent)_22%,var(--n-surface))]">
        {message.content}
      </div>
    );
  }
  return (
    <div
      className={`self-start max-w-[92%] px-3 py-2 rounded-2xl rounded-bl-md wrap-break-word bg-[color-mix(in_srgb,var(--n-text)_6%,transparent)] ${
        message.error ? "text-(--n-down)" : ""
      }`}
    >
      {message.content ? <ChatMarkdown text={message.content} /> : pending && <TypingDots />}
    </div>
  );
}

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const { isAuthenticated, initializing } = useAppSelector((s) => s.auth);
  const { messages, status, activeTool, usage, availability } = useAppSelector((s) => s.chat);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const streaming = status === "streaming";
  const outOfMessages = usage !== null && usage.remaining <= 0;
  const notice =
    availability === "unavailable" || availability === "unreachable"
      ? AVAILABILITY_NOTICES[availability]
      : null;
  const canSend = isAuthenticated && !streaming && !outOfMessages && !notice;

  useEffect(() => {
    inputRef.current?.focus();
  }, [isAuthenticated]);

  // Follow the answer as it streams in.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, activeTool]);

  const send = (text: string) => {
    if (!canSend || !text.trim()) return;
    dispatch(sendChatMessage({ text, currency }));
    setInput("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const lastId = messages[messages.length - 1]?.id;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-panel-title"
      className="fixed z-80 inset-0 flex flex-col bg-(--n-surface) lg:inset-auto lg:right-5 lg:bottom-21 lg:w-100 lg:h-[min(620px,calc(100vh-120px))] lg:rounded-[14px] lg:overflow-hidden"
      style={{ boxShadow: "var(--n-shadow-md)" }}
    >
      <header className="flex items-center gap-2 px-4 h-14 shrink-0 border-b border-(--n-divider) pt-[env(safe-area-inset-top)] lg:pt-0">
        <h2 id="chat-panel-title" className="m-0 text-base mr-auto">
          Assistant marché
        </h2>
        <span className="n-tag n-tag-neutral">IA</span>
        {isAuthenticated && messages.length > 0 && (
          <button
            type="button"
            className="n-btn n-btn-icon"
            onClick={() => dispatch(conversationCleared())}
            disabled={streaming}
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
          >
            <ArrowCounterClockwiseIcon size={18} />
          </button>
        )}
        <button
          type="button"
          className="n-btn n-btn-icon"
          onClick={onClose}
          aria-label="Fermer l'assistant"
        >
          <CloseIcon size={18} />
        </button>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-label="Conversation"
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 text-sm leading-relaxed"
      >
        {initializing ? (
          <div className="m-auto">
            <TypingDots />
          </div>
        ) : !isAuthenticated ? (
          <div className="m-auto flex flex-col items-center gap-3 text-center max-w-70">
            <p className="m-0">
              Connecte-toi pour interroger l&apos;assistant sur les cours, les tendances et ta
              watchlist.
            </p>
            <Link href="/login" className="n-btn n-btn-primary" onClick={onClose}>
              Se connecter
            </Link>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col gap-3 mt-auto">
            <p className="m-0 text-(--n-neutral-400)">
              Pose une question sur le marché crypto. Je réponds avec les données en direct de
              l&apos;application.
            </p>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="n-btn n-btn-secondary text-left whitespace-normal!"
                  onClick={() => send(s)}
                  disabled={!canSend}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} message={m} pending={streaming && m.id === lastId} />
          ))
        )}
      </div>

      {isAuthenticated && notice && (
        <div
          role="alert"
          className="shrink-0 mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs text-(--n-down) bg-[color-mix(in_srgb,var(--n-down)_12%,transparent)]"
        >
          <span className="mr-auto">{notice}</span>
          <button
            type="button"
            className="n-btn n-btn-secondary text-xs! px-2! py-1!"
            onClick={() => dispatch(fetchChatUsage())}
          >
            Réessayer
          </button>
        </div>
      )}

      {isAuthenticated && (
        <div className="shrink-0 border-t border-(--n-divider) px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
          <p className="m-0 mb-1.5 min-h-4.5 text-xs text-(--n-neutral-400)" aria-live="polite">
            {streaming && activeTool ? TOOL_LABELS[activeTool] ?? "Consultation des données…" : ""}
          </p>
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Ta question
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_INPUT}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={outOfMessages || notice !== null}
              placeholder={
                outOfMessages ? "Limite du jour atteinte, reviens demain" : "Pose ta question…"
              }
              className="n-input flex-1 resize-none max-h-32 min-h-11 py-2.5"
            />
            <button
              type="submit"
              className="n-btn n-btn-primary w-11! h-11! shrink-0"
              disabled={!canSend || !input.trim()}
              aria-label="Envoyer"
            >
              <PaperPlaneIcon size={18} />
            </button>
          </form>
          <p className="m-0 mt-1.5 text-[11px] text-(--n-neutral-500)">
            {usage ? `${usage.remaining} message${usage.remaining > 1 ? "s" : ""} restant${usage.remaining > 1 ? "s" : ""} aujourd'hui · ` : ""}
            Pas un conseil financier.
          </p>
        </div>
      )}
    </section>
  );
}
