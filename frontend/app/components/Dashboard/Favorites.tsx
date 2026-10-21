"use client";

import { useAppDispatch } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { toggleWatchlist } from "@/app/lib/features/watchlist/watchlistSlice";
import type { CoinSummary } from "@/app/types/Crypto/Crypto";
import CoinAvatar from "@/app/ui/CoinAvatar/CoinAvatar";
import { PlusIcon, StarIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import {
  formatFiatPrice,
  formatSignedPercent,
} from "@/app/utils/Format/FrFormat/FrFormat";
import { useAppSearch } from "../AppShell/SearchContext";

interface FavoritesProps {
  coins: CoinSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const trend = (v?: number) =>
  typeof v !== "number" || v === 0
    ? "var(--n-neutral-400)"
    : v > 0
      ? "var(--n-up)"
      : "var(--n-down)";

function Price({ coin }: { coin: CoinSummary }) {
  const { currency } = useCurrency();
  return typeof coin.price === "number"
    ? formatFiatPrice(coin.price, currency)
    : "—";
}

function Change({ coin }: { coin: CoinSummary }) {
  return typeof coin.change_24h === "number"
    ? formatSignedPercent(coin.change_24h)
    : "—";
}

export default function Favorites({
  coins,
  selectedId,
  onSelect,
}: FavoritesProps) {
  const dispatch = useAppDispatch();
  const { openSearch } = useAppSearch();

  return (
    <section
      className="flex flex-col gap-1.5 lg:gap-2.5"
      aria-labelledby="fav-title"
    >
      <div className="flex items-center gap-2.5">
        <h2 id="fav-title" className="m-0 text-base lg:text-[17px]">
          Mes favoris
        </h2>
        {coins.length > 0 && (
          <span className="text-[13px] text-(--n-neutral-500)">
            {coins.length}
          </span>
        )}
        <button
          type="button"
          className="n-btn ml-auto px-1! min-h-11 lg:min-h-0 text-(--n-accent)! hover:bg-[color-mix(in_srgb,var(--n-accent)_10%,transparent)]"
          onClick={openSearch}
        >
          <PlusIcon />
          Ajouter
        </button>
      </div>

      {coins.length === 0 ? (
        <div className="n-panel flex flex-col items-start gap-2 p-4 lg:p-5">
          <p className="m-0 text-sm text-(--n-neutral-300)">
            Ajoutez des cryptos à vos favoris pour suivre leur cours ici et les
            afficher en un clic dans le graphique.
          </p>
          <button
            type="button"
            className="n-btn n-btn-primary min-h-11 lg:min-h-0"
            onClick={openSearch}
          >
            <PlusIcon />
            Rechercher une crypto
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: cards */}
          <ul className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-3 m-0 p-0 list-none">
            {coins.map((coin) => {
              const selected = coin.id === selectedId;
              return (
                <li
                  key={coin.id}
                  className="relative n-panel transition-shadow"
                  style={{
                    boxShadow: selected
                      ? "inset 0 0 0 1px var(--n-accent), 0 0 28px -12px var(--n-accent)"
                      : undefined,
                  }}
                >
                  <button
                    type="button"
                    className="flex flex-col gap-3 w-full px-4 py-3.5 pr-11 border-0 bg-transparent text-left font-[inherit] text-(--n-text) cursor-pointer rounded-lg hover:bg-[color-mix(in_srgb,var(--n-text)_3%,transparent)]"
                    aria-pressed={selected}
                    aria-label={`Afficher ${coin.name} dans le graphique`}
                    onClick={() => onSelect(coin.id)}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <CoinAvatar
                        image={coin.image}
                        name={coin.name}
                        symbol={coin.symbol}
                      />
                      <span className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-medium truncate">
                          {coin.name}
                        </span>
                        <span className="text-xs text-(--n-neutral-500)">
                          {coin.symbol.toUpperCase()}
                        </span>
                      </span>
                    </span>
                    <span className="n-tnum flex flex-col gap-1">
                      <span className="text-[22px] font-medium tracking-[-0.01em] whitespace-nowrap">
                        <Price coin={coin} />
                      </span>
                      <span className="flex gap-1.5 text-[13px]">
                        <span style={{ color: trend(coin.change_24h) }}>
                          <Change coin={coin} />
                        </span>
                        <span className="text-(--n-neutral-500)">24 h</span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="n-btn n-btn-icon absolute top-2.5 right-2.5 w-8! h-8! text-(--n-accent)!"
                    aria-label={`Retirer ${coin.name} des favoris`}
                    onClick={() => dispatch(toggleWatchlist(coin.id))}
                  >
                    <StarIcon />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Mobile: compact list */}
          <ul
            className="lg:hidden flex flex-col gap-px m-0 p-0 list-none rounded-lg overflow-hidden"
            style={{
              background:
                "color-mix(in srgb, var(--n-text) 7%, var(--n-surface))",
            }}
          >
            {coins.map((coin) => {
              const selected = coin.id === selectedId;
              return (
                <li key={coin.id}>
                  <button
                    type="button"
                    className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 w-full min-h-[62px] px-3.5 border-0 text-left font-[inherit] text-(--n-text) cursor-pointer"
                    style={{
                      background: selected
                        ? "color-mix(in srgb, var(--n-accent) 12%, var(--n-surface))"
                        : "var(--n-surface)",
                      boxShadow: selected
                        ? "inset 2px 0 0 var(--n-accent)"
                        : "none",
                    }}
                    aria-pressed={selected}
                    aria-label={`Afficher ${coin.name} dans le graphique`}
                    onClick={() => onSelect(coin.id)}
                  >
                    <CoinAvatar
                      image={coin.image}
                      name={coin.name}
                      symbol={coin.symbol}
                      size={32}
                    />
                    <span className="flex flex-col leading-[1.3] min-w-0">
                      <span className="text-sm font-medium truncate">
                        {coin.name}
                      </span>
                      <span className="text-xs text-(--n-neutral-500)">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </span>
                    <span className="n-tnum flex flex-col items-end leading-[1.3]">
                      <span className="text-sm font-medium whitespace-nowrap">
                        <Price coin={coin} />
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: trend(coin.change_24h) }}
                      >
                        <Change coin={coin} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
