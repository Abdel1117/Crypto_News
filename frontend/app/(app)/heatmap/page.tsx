"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/lib/hooks";
import { useCurrency } from "@/app/context/Curency/CurrencyContext";
import { setSelectedSymbol } from "@/app/lib/features/marketView/marketViewSlice";
import { useDenseMarketHeatmap } from "@/app/hooks/useDenseMarketHeatmap";
import {
  HeaderActions,
  HeaderTitleExtra,
} from "@/app/components/AppShell/HeaderSlots";
import MarketTreemap, {
  HEATMAP_SCALE,
  tileBackground,
} from "@/app/components/HeatMap/MarketTreemap";
import {
  ArrowsClockwiseIcon,
  CheckIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import { isStablecoin } from "@/app/utils/constants/stablecoins";

const COIN_LIMIT = 50;

function StablecoinToggle({
  checked,
  onChange,
  className = "",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={`relative flex items-center gap-2 px-3 rounded-lg cursor-pointer text-(--n-neutral-300) bg-[color-mix(in_srgb,var(--n-text)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--n-text)_8%,transparent)] has-focus-visible:outline-2 has-focus-visible:outline-(--n-accent) ${className}`}
    >
      <input
        type="checkbox"
        className="absolute opacity-0 w-0 h-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={`grid place-items-center w-4 h-4 rounded-[4px] ${
          checked
            ? "bg-(--n-accent) text-(--n-bg)"
            : "border-[1.5px] border-(--n-neutral-500)"
        }`}
      >
        {checked && <CheckIcon size={12} strokeWidth={28} />}
      </span>
      Masquer les stablecoins
    </label>
  );
}

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function HeatmapPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currency } = useCurrency();
  const { data, loading, error, updatedAt, refresh } = useDenseMarketHeatmap(
    currency,
    COIN_LIMIT,
  );
  const [hideStables, setHideStables] = useState(true);

  const coins = hideStables
    ? data.filter((c) => !isStablecoin(c.symbol))
    : data;
  const updated = updatedAt ? `mis à jour à ${fmtTime(updatedAt)}` : null;

  const openChart = (id: string) => {
    dispatch(setSelectedSymbol(id));
    router.push("/dashboard");
  };

  const legend = `linear-gradient(to right, ${tileBackground(-HEATMAP_SCALE)}, var(--n-surface), ${tileBackground(HEATMAP_SCALE)})`;

  return (
    <>
      <HeaderTitleExtra>
        <span className="basis-full lg:basis-auto text-xs lg:text-[13px] text-(--n-neutral-500)">
          <span className="lg:hidden">
            Top {COIN_LIMIT}
            {updated && ` · ${updated}`}
          </span>
          <span className="hidden lg:inline">
            Top {COIN_LIMIT} par capitalisation
          </span>
        </span>
      </HeaderTitleExtra>
      <HeaderActions>
        <StablecoinToggle
          checked={hideStables}
          onChange={setHideStables}
          className="hidden lg:flex min-h-9 text-[13px]"
        />
        {updated && (
          <span className="hidden lg:inline pl-2 pr-1 text-[13px] text-(--n-neutral-500)">
            Mis à jour à {fmtTime(updatedAt as number)}
          </span>
        )}
        <button
          type="button"
          className="n-btn n-btn-icon w-11! h-11! lg:w-auto! lg:h-auto! lg:min-h-9 lg:px-3! lg:border-(--n-divider)!"
          onClick={refresh}
          aria-label="Actualiser la heatmap"
        >
          <ArrowsClockwiseIcon size={18} />
          <span className="hidden lg:inline">Actualiser</span>
        </button>
      </HeaderActions>

      <div className="flex flex-col gap-3 lg:gap-3.5">
        <StablecoinToggle
          checked={hideStables}
          onChange={setHideStables}
          className="lg:hidden min-h-11 text-sm"
        />

        {error ? (
          <div className="n-panel h-[560px] lg:h-[600px] flex flex-col items-center justify-center gap-3 text-sm text-(--n-neutral-400)">
            <p className="m-0">{error}</p>
            <button
              type="button"
              className="n-btn n-btn-secondary"
              onClick={refresh}
            >
              Réessayer
            </button>
          </div>
        ) : loading ? (
          <div
            className="n-skeleton h-[560px] lg:h-[600px]"
            aria-busy="true"
            aria-label="Chargement de la heatmap"
          />
        ) : coins.length === 0 ? (
          <div className="n-panel h-[560px] lg:h-[600px] grid place-items-center text-sm text-(--n-neutral-400)">
            Aucune donnée de marché disponible.
          </div>
        ) : (
          <MarketTreemap
            coins={coins}
            currency={currency}
            onSelect={openChart}
          />
        )}

        <div className="flex items-center gap-2.5 lg:gap-3 text-xs text-(--n-neutral-400) n-tnum">
          <span className="hidden lg:inline">Variation 24 h</span>
          <span>−{HEATMAP_SCALE}&nbsp;%</span>
          <span
            aria-hidden="true"
            className="flex-1 lg:flex-none lg:w-60 h-2 rounded"
            style={{ background: legend }}
          />
          <span>+{HEATMAP_SCALE}&nbsp;%</span>
          <span className="hidden lg:inline ml-auto">
            Taille des cases : capitalisation
          </span>
        </div>
      </div>
    </>
  );
}
