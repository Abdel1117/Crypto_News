"use client";

import React, { createContext, useContext, useState } from "react";

export type Currency = "eur" | "usd";

interface CurrencyContextInterface {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextInterface | null>(null);

function getInitialCurrency(): Currency {
  if (typeof window === "undefined") return "eur";
  const stored = localStorage.getItem("currency");
  return stored === "usd" ? "usd" : "eur";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(getInitialCurrency);

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
