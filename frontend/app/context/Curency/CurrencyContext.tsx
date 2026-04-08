"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "eur" | "usd";

interface CurrencyContextInterface {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextInterface | null>(null);

const DEFAULT_CURRENCY: Currency = "eur";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    const stored = localStorage.getItem("currency");
    if (stored === "usd" || stored === "eur") {
      setCurrency(stored);
    }
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
