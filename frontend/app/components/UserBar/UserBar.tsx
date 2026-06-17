"use client";

import { useEffect, useRef, useState } from "react";
import { UserIcon, MessageIcon, RingIcon, SearchIcon } from "../Icons";
import Link from "next/link";
import { ThemeButton } from "../ThemeButton/ThemeButton";
import { ParamButton } from "../ParamButton/ParamButton";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { useAppDispatch } from "@/app/lib/hooks";
import { toggleWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
import {
  SymbolData,
  addSymbolIfMissing,
} from "@/app/lib/features/symbol/symbolSlice";
import { searchSymbols } from "@/app/lib/api/crypto";
import { getMarketCoin } from "@/app/lib/features/prices/pricesThunks";

/**
 * UserBar component renders the top-right action bar with user controls.
 *
 * Includes a search toggle for crypto lookup, watchlist actions, and icon navigation.
 */
export default function UserBar({ className = "" }: { className?: string }) {
  const dispatch = useAppDispatch();
  const { currency } = useCurrency();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SymbolData[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  /**
   * Toggle the crypto search panel open or closed.
   *
   * When closing the panel, clear pending debounce timers and reset local state.
   */
  const handleToggleSearch = () => {
    if (searchOpen && debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
    setSearchOpen((open) => !open);
  };

  /**
   * Handle input changes for the search field.
   *
   * Starts the loading indicator immediately and clears results when the input is empty.
   * The actual search is debounced in the effect below.
   *
   * @param value The current input text entered by the user.
   */
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
  };

  useEffect(() => {
    if (!searchOpen || !query.trim()) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setSearchError(null);
        const results = await searchSymbols(query.trim());
        setResults(results);
      } catch (error) {
        setResults([]);
        setSearchError(
          error instanceof Error ? error.message : "Search failed",
        );
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchOpen]);

  /**
   * Toggle a crypto item in the watchlist and close the search panel.
   *
   * @param event Mouse event used to stop propagation from the item button.
   * @param id Crypto id to toggle in the watchlist state.
   */
  const handleAddFromResults = (
    event: React.MouseEvent<HTMLButtonElement>,
    coin: SymbolData,
  ) => {
    event.stopPropagation();
    // ensure the symbol exists in the canonical symbols store with origin metadata
    dispatch(addSymbolIfMissing({ ...coin, origin: "search" }));
    dispatch(getMarketCoin({ currency, cryptoId: coin.id }));
    dispatch(toggleWatchlist(coin.id));
    setSearchOpen(false);
  };

  return (
    <div className={className || "w-full relative"}>
      <ul className="flex justify-between xs:justify-end items-center flex-wrap gap-5">
        <li className="pr-6">
          <button
            type="button"
            aria-label="Rechercher une crypto"
            className="px-2 cursor-pointer"
            onClick={handleToggleSearch}
          >
            <SearchIcon width={30} height={30} />
          </button>
        </li>
        <li className="pr-6">
          <Link className="px-2 cursor-pointer" href="">
            <RingIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <Link className="px-2 cursor-pointer" href="">
            <MessageIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <Link className="px-2 cursor-pointer" href="/login">
            <UserIcon width={30} height={30} />
          </Link>
        </li>
        <li className="pr-6">
          <ThemeButton />
        </li>
        <li className="pr-6">
          <ParamButton />
        </li>
      </ul>

      {searchOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-full max-w-sm rounded-3xl border border-border bg-background p-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label htmlFor="crypto-search" className="sr-only">
                Rechercher une cryptomonnaie
              </label>
              <input
                id="crypto-search"
                type="search"
                value={query}
                autoComplete="off"
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Rechercher une crypto..."
                className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <button
                type="button"
                className="rounded-2xl border border-border px-3 py-2 text-sm text-muted transition hover:bg-card hover:cursor-pointer"
                onClick={() => setSearchOpen(false)}
              >
                Fermer
              </button>
            </div>

            <div className="min-h-30 rounded-2xl bg-card px-3 py-3 text-sm text-muted">
              {!query.trim() ? (
                <p>
                  Commencez à taper un nom ou un symbole, puis attendez 2
                  secondes.
                </p>
              ) : loading ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                  Recherche en cours...
                </div>
              ) : searchError ? (
                <p className="text-sm text-danger">{searchError}</p>
              ) : results.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {results.map((coin) => (
                    <div
                      key={coin.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-sm text-foreground">
                          {coin.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {coin.symbol.toUpperCase()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => handleAddFromResults(event, coin)}
                        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90 hover:cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucune crypto trouvée pour «{query}».</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
