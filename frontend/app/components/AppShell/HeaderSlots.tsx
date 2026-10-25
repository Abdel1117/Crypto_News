"use client";

import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

interface HeaderSlotsCtx {
  title: HTMLElement | null;
  actions: HTMLElement | null;
}

export const HeaderSlotsContext = createContext<HeaderSlotsCtx>({
  title: null,
  actions: null,
});

/** Renders next to the page title in the app top bar. */
export function HeaderTitleExtra({ children }: { children: React.ReactNode }) {
  const { title } = useContext(HeaderSlotsContext);
  return title ? createPortal(children, title) : null;
}

/** Renders page-specific actions in the app top bar (before the currency). */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const { actions } = useContext(HeaderSlotsContext);
  return actions ? createPortal(children, actions) : null;
}
