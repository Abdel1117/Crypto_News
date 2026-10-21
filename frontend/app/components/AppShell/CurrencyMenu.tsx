"use client";

import { useEffect, useRef, useState } from "react";
import {
  useCurrency,
  type Currency,
} from "@/app/context/Curency/CurrencyContext";
import { CaretDownIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "eur", label: "EUR · Euro" },
  { value: "usd", label: "USD · Dollar" },
];

/** Page-wide currency switch, in the top bar (it applies to every figure). */
export default function CurrencyMenu({
  className = "",
}: {
  className?: string;
}) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className="n-btn n-btn-secondary min-h-9 max-lg:min-h-11"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Devise : ${currency.toUpperCase()}`}
        onClick={() => setOpen((v) => !v)}
      >
        {currency.toUpperCase()}
        <CaretDownIcon size={12} />
      </button>
      {open && (
        <div className="n-menu right-0 top-[calc(100%+6px)] w-44" role="menu">
          {CURRENCIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="menuitemradio"
              aria-checked={currency === c.value}
              className={`n-menu-item ${currency === c.value ? "text-(--n-accent)!" : ""}`}
              onClick={() => {
                setCurrency(c.value);
                setOpen(false);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
