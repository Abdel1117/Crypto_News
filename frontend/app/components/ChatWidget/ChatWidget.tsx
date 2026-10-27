"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { setChatOpen } from "@/app/lib/features/chat/chatSlice";
import { fetchChatUsage } from "@/app/lib/features/chat/chatThunks";
import { initWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
import { initSimulation } from "@/app/lib/features/simulation/simulationSlice";
import { ChatDotsIcon, CloseIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import ChatPanel from "./ChatPanel";

/** Floating market assistant, available on every page of the app shell. */
export default function ChatWidget() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.chat.isOpen);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const needsCheck = useAppSelector(
    (s) => s.chat.usage === null || s.chat.availability !== "available",
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    dispatch(setChatOpen(false));
    buttonRef.current?.focus();
  };

  // The watchlist and simulated portfolio are only loaded by their own pages:
  // load them here so the assistant can use them from anywhere.
  useEffect(() => {
    if (!isOpen) return;
    dispatch(initWatchlist());
    dispatch(initSimulation());
  }, [isOpen, dispatch]);

  // Checks the counter and whether the assistant is reachable each time the
  // panel opens, until it is known to work.
  useEffect(() => {
    if (isOpen && isAuthenticated && needsCheck) dispatch(fetchChatUsage());
    // needsCheck is left out on purpose: re-run on open, not on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch(setChatOpen(false));
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, dispatch]);

  return (
    <>
      {isOpen && <ChatPanel onClose={close} />}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? close() : dispatch(setChatOpen(true)))}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant marché"}
        className={`n-chat-fab n-btn fixed right-4 lg:right-5 z-50 w-12! h-12! rounded-full! bg-(--n-accent)! text-(--n-bg)! hover:opacity-90 shadow-(--n-shadow-md) ${
          isOpen ? "max-lg:hidden" : ""
        }`}
      >
        {isOpen ? <CloseIcon size={20} /> : <ChatDotsIcon size={22} />}
      </button>
    </>
  );
}
