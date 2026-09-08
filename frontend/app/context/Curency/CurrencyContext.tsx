"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { send, onOpen } from "@/app/lib/ws/socket";

export type Currency = "eur" | "usd";

interface CurrencyContextInterface {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextInterface | null>(null);

const DEFAULT_CURRENCY: Currency = "eur";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const currencyRef = useRef(currency);

  useEffect(() => {
    const stored = localStorage.getItem("currency");
    if (stored === "usd" || stored === "eur") {
      setCurrency(stored);
    }
  }, []);

  useEffect(() => {
    currencyRef.current = currency;
    send({ currency });
  }, [currency]);

  useEffect(() => {
    return onOpen(() => send({ currency: currencyRef.current }));
  }, []);

  const handleSetCurrency = (value: Currency) => {
    setCurrency(value);
    localStorage.setItem("currency", value);
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency: handleSetCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
