"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Currency } from "@/app/context/Curency/CurrencyContext";
import type { CryptoMarketData } from "@/app/types/Crypto/Crypto";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import {
  CaretDownIcon,
  CheckIcon,
  SearchIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import { formatFiatPrice } from "@/app/utils/Format/FrFormat/FrFormat";

interface CoinPickerProps {
  label: string;
  coins: CryptoMarketData[];
  value: string | null;
  onChange: (id: string) => void;
  currency: Currency;
  emptyLabel: string;
  hint?: React.ReactNode;
}

/** Crypto selector that shows each coin's icon (a native select can't). */
export default function CoinPicker({
  label,
  coins,
  value,
  onChange,
  currency,
  emptyLabel,
  hint,
}: CoinPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const listId = useId();
  const hintId = useId();

  const selected = coins.find((c) => c.id === value);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? coins.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q),
      )
    : coins;

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const pick = (id: string) => {
    onChange(id);
    close();
  };

  return (
    <div ref={rootRef} className="n-field relative">
      <span id={labelId} className="n-label">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="n-text-input flex items-center gap-2.5 text-left cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${listId}-value`}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        disabled={coins.length === 0}
      >
        <span
          id={`${listId}-value`}
          className="flex items-center gap-2.5 min-w-0"
        >
          {selected ? (
            <>
              <CoinAvatar
                image={selected.image}
                name={selected.name}
                symbol={selected.symbol}
                size={22}
              />
              <span className="truncate">{selected.name}</span>
              <span className="text-[13px] text-(--n-neutral-500)">
                {selected.symbol.toUpperCase()}
              </span>
            </>
          ) : (
            <span className="text-(--n-neutral-500)">{emptyLabel}</span>
          )}
        </span>
        <CaretDownIcon
          size={12}
          className="ml-auto flex-none text-(--n-neutral-500)"
        />
      </button>
      {hint && (
        <p
          id={hintId}
          className="m-0 mt-1.5 text-xs text-(--n-neutral-500) n-tnum"
        >
          {hint}
        </p>
      )}

      {open && (
        <div
          className="n-menu left-0 right-0 top-[calc(100%-2px)] max-h-80 flex flex-col"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <div className="relative mb-1.5">
            <SearchIcon
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--n-neutral-500) pointer-events-none"
            />
            <input
              ref={searchRef}
              type="search"
              className="n-text-input min-h-10! text-sm! pl-8!"
              placeholder="Filtrer…"
              aria-label="Filtrer les cryptos"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className="m-0 p-0 list-none overflow-y-auto"
          >
            {filtered.length === 0 && (
              <li className="px-2.5 py-3 text-sm text-(--n-neutral-400)">
                Aucune crypto.
              </li>
            )}
            {filtered.map((c) => (
              <li
                key={c.id}
                role="option"
                aria-selected={c.id === value}
                tabIndex={0}
                className="n-menu-item n-tnum"
                onClick={() => pick(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(c.id);
                  }
                }}
              >
                <CoinAvatar
                  image={c.image}
                  name={c.name}
                  symbol={c.symbol}
                  size={22}
                />
                <span className="truncate">{c.name}</span>
                <span className="text-xs text-(--n-neutral-500)">
                  {c.symbol.toUpperCase()}
                </span>
                <span className="ml-auto text-xs text-(--n-neutral-400) whitespace-nowrap">
                  {formatFiatPrice(c.price, currency)}
                </span>
                {c.id === value && (
                  <CheckIcon
                    size={14}
                    className="text-(--n-accent) flex-none"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
