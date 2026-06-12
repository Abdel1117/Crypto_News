"use client";
import React, { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import type { Currency } from "@/app/context/Curency/CurrencyContext";
import { ParamIcons } from "../Icons/index";

const currencies: { value: Currency; label: string }[] = [
  { value: "eur", label: "EUR €" },
  { value: "usd", label: "USD $" },
];

export function ParamButton() {
  const [open, setOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: Currency) => {
    setCurrency(value);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        className="
        flex items-center 
        bg-card text-foreground 
        shadow-lg rounded-full text-sm 
        font-medium hover:bg-surface 
        transition-colors 
        hover:cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <ParamIcons />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-surface rounded-lg shadow-xl z-50 overflow-hidden ">
          <p className="text-muted text-xs px-3 pt-3 pb-1">
            Choisiez une monaie
          </p>
          <ul>
            {currencies.map((item) => (
              <li key={item.value}>
                <button
                  className={[
                    "w-full text-left px-3 py-2 text-sm transition-colors hover:cursor-pointer",
                    currency === item.value
                      ? "text-primary font-semibold bg-surface"
                      : "text-foreground hover:bg-surface",
                  ].join(" ")}
                  onClick={() => handleSelect(item.value)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
