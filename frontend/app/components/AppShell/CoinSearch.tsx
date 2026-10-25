"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { searchSymbols } from "@/app/lib/api/crypto";
import {
  SymbolData,
  addSymbolIfMissing,
} from "@/app/lib/features/symbol/symbolSlice";
import { getMarketCoin } from "@/app/lib/features/prices/pricesThunks";
import { toggleWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import {
  SearchIcon,
  StarIcon,
  StarOutlineIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

// The search hits the backend (and CoinGecko behind it): debounce typing.
const SEARCH_DEBOUNCE_MS = 600;

interface CoinSearchProps {
  className?: string;
  /** Shows the "Ctrl K" hint (desktop header only). */
  showShortcut?: boolean;
  onClose?: () => void;
}

/**
 * Crypto search field with a results list; each result toggles the coin in
 * the favourites (watchlist).
 */
const CoinSearch = forwardRef<HTMLInputElement, CoinSearchProps>(
  function CoinSearch({ className = "", showShortcut = false, onClose }, ref) {
    const dispatch = useAppDispatch();
    const { currency } = useCurrency();
    const watchlistIds = useAppSelector((state) => state.watchlist.ids);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SymbolData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focused, setFocused] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const trimmed = query.trim();
    const open = focused && trimmed.length > 0;

    useEffect(() => {
      if (!trimmed) return;
      let cancelled = false;
      const timer = window.setTimeout(async () => {
        try {
          const found: SymbolData[] = await searchSymbols(trimmed);
          if (cancelled) return;
          setResults(found);
          setError(null);
        } catch (err) {
          if (cancelled) return;
          setResults([]);
          setError(
            err instanceof Error ? err.message : "La recherche a échoué.",
          );
        } finally {
          if (!cancelled) setLoading(false);
        }
      }, SEARCH_DEBOUNCE_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }, [trimmed]);

    // Close the results when clicking outside.
    useEffect(() => {
      if (!open) return;
      const onPointerDown = (e: MouseEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setFocused(false);
      };
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    const handleChange = (value: string) => {
      setQuery(value);
      setLoading(value.trim().length > 0);
      if (!value.trim()) setResults([]);
    };

    const handleToggle = (coin: SymbolData) => {
      const isFavorite = watchlistIds.includes(coin.id);
      if (!isFavorite) {
        dispatch(addSymbolIfMissing({ ...coin, origin: "search" }));
        dispatch(getMarketCoin({ currency, cryptoId: coin.id }));
      }
      dispatch(toggleWatchlist(coin.id));
    };

    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <SearchIcon
          className="absolute left-[11px] top-1/2 -translate-y-1/2 text-(--n-neutral-500) pointer-events-none"
          size={16}
        />
        <input
          ref={ref}
          type="search"
          aria-controls={listId}
          aria-label="Rechercher une crypto"
          placeholder="Rechercher une crypto…"
          autoComplete="off"
          className={`n-text-input pl-[34px]! ${showShortcut ? "pr-[62px]!" : ""}`}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
              (e.target as HTMLInputElement).blur();
              onClose?.();
            }
          }}
        />
        {showShortcut && (
          <kbd className="n-tag n-tag-neutral absolute right-[7px] top-1/2 -translate-y-1/2 px-1.5! py-px! text-[10px]! font-[inherit]">
            Ctrl K
          </kbd>
        )}

        {open && (
          <div
            id={listId}
            className="n-menu left-0 right-0 top-[calc(100%+6px)] max-h-80 overflow-y-auto"
          >
            {loading ? (
              <p className="m-0 flex items-center gap-2 px-2.5 py-3 text-sm text-(--n-neutral-400)">
                <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                Recherche en cours…
              </p>
            ) : error ? (
              <p className="m-0 px-2.5 py-3 text-sm text-(--n-down)">{error}</p>
            ) : results.length === 0 ? (
              <p className="m-0 px-2.5 py-3 text-sm text-(--n-neutral-400)">
                Aucune crypto trouvée pour « {trimmed} ».
              </p>
            ) : (
              <ul className="m-0 p-0 list-none">
                {results.map((coin) => {
                  const isFavorite = watchlistIds.includes(coin.id);
                  return (
                    <li key={coin.id}>
                      <button
                        type="button"
                        className="n-menu-item"
                        onClick={() => handleToggle(coin)}
                        aria-label={`${
                          isFavorite ? "Retirer" : "Ajouter"
                        } ${coin.name} ${isFavorite ? "des" : "aux"} favoris`}
                      >
                        <CoinAvatar
                          image={coin.image}
                          name={coin.name}
                          symbol={coin.symbol}
                          size={24}
                        />
                        <span className="flex flex-col min-w-0 leading-tight">
                          <span className="truncate font-medium">
                            {coin.name}
                          </span>
                          <span className="text-xs text-(--n-neutral-500)">
                            {coin.symbol.toUpperCase()}
                          </span>
                        </span>
                        <span
                          className={`ml-auto flex items-center gap-1.5 text-xs ${
                            isFavorite
                              ? "text-(--n-accent)"
                              : "text-(--n-neutral-400)"
                          }`}
                        >
                          {isFavorite ? (
                            <StarIcon size={14} />
                          ) : (
                            <StarOutlineIcon size={14} />
                          )}
                          {isFavorite ? "Dans vos favoris" : "Ajouter"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  },
);

export default CoinSearch;
