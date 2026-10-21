import {
  CaretDownIcon,
  SearchIcon,
  StarIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import { previewChart, previewFavorites } from "./previewData";

const trend = (up: boolean) => (up ? "var(--n-up)" : "var(--n-down)");

const FADE_MASK = (stop: string) => ({
  WebkitMaskImage: `linear-gradient(to bottom, black ${stop}, transparent)`,
  maskImage: `linear-gradient(to bottom, black ${stop}, transparent)`,
});

function DesktopPreview() {
  const chart = previewChart;
  return (
    <div
      className="hidden lg:block mx-[120px] mt-[72px] h-[540px] overflow-hidden border border-b-0 border-(--n-neutral-800) rounded-t-[14px]"
      style={{
        background:
          "radial-gradient(700px 400px at 90% -100px, color-mix(in srgb, var(--n-accent-900) 70%, transparent), transparent 60%), var(--n-bg)",
        ...FADE_MASK("58%"),
      }}
    >
      <div className="flex items-center gap-2.5 h-14 px-[22px]">
        <span className="mr-auto text-[17px] font-medium">Dashboard</span>
        <span className="n-input w-[280px]">
          <SearchIcon />
          Rechercher une crypto…
        </span>
        <span className="n-btn n-btn-secondary min-h-9">
          EUR
          <CaretDownIcon size={12} />
        </span>
      </div>

      <div className="flex flex-col gap-3 px-[22px] pt-1 pb-[22px]">
        <span className="text-[15px] font-medium">Mes favoris</span>
        <div className="grid grid-cols-4 gap-3">
          {previewFavorites.map((c, i) => (
            <div
              key={c.sym}
              className="flex flex-col gap-3 px-4 py-3.5 rounded-lg bg-(--n-surface)"
              style={{
                boxShadow:
                  i === 0
                    ? "inset 0 0 0 1px var(--n-accent), 0 0 28px -12px var(--n-accent)"
                    : "none",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 flex-none rounded-full grid place-items-center text-xs font-medium bg-(--n-neutral-800) text-(--n-neutral-200)">
                  {c.mono}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-(--n-neutral-500)">
                    {c.sym}
                  </span>
                </span>
                <StarIcon className="ml-auto text-(--n-accent)" />
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="n-tnum flex flex-col gap-1">
                  <span className="text-[21px] font-medium whitespace-nowrap">
                    {c.priceF}
                  </span>
                  <span className="text-[13px]" style={{ color: trend(c.up) }}>
                    {c.chgF}
                  </span>
                </span>
                <svg
                  width="88"
                  height="30"
                  viewBox="0 0 100 32"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="flex-none"
                >
                  <polygon
                    points={c.sparkArea}
                    style={{ fill: trend(c.up), fillOpacity: 0.12 }}
                  />
                  <polyline
                    points={c.spark}
                    vectorEffect="non-scaling-stroke"
                    style={{
                      fill: "none",
                      stroke: trend(c.up),
                      strokeWidth: 1.5,
                      strokeLinejoin: "round",
                    }}
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 px-5 py-[18px] rounded-lg bg-(--n-surface)">
          <div className="flex items-start">
            <span className="n-tnum flex flex-col gap-1 mr-auto">
              <span className="text-[13px] text-(--n-neutral-400)">
                {chart.name} · BTC / EUR
              </span>
              <span className="flex items-baseline gap-2.5">
                <span className="text-[28px] font-medium tracking-[-0.015em]">
                  {chart.priceF}
                </span>
                <span className="text-sm" style={{ color: trend(chart.up) }}>
                  {chart.chgF}
                </span>
              </span>
            </span>
            <div className="n-seg">
              <span className="n-seg-opt" data-active="">
                1J
              </span>
              <span className="n-seg-opt">1S</span>
              <span className="n-seg-opt">1M</span>
              <span className="n-seg-opt">1A</span>
            </div>
          </div>
          <div className="relative h-60">
            {chart.ticks.map((top) => (
              <div
                key={top}
                className="absolute inset-x-0 h-px"
                style={{
                  top,
                  background:
                    "color-mix(in srgb, var(--n-text) 6%, transparent)",
                }}
              />
            ))}
            <svg
              viewBox="0 0 1000 300"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <linearGradient
                  id="landingChartFade"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "var(--n-accent)", stopOpacity: 0.28 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "var(--n-accent)", stopOpacity: 0 }}
                  />
                </linearGradient>
              </defs>
              <polygon points={chart.area} fill="url(#landingChartFade)" />
            </svg>
            <svg
              viewBox="0 0 1000 300"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full overflow-visible"
              style={{
                filter:
                  "drop-shadow(0 0 6px color-mix(in srgb, var(--n-accent) 55%, transparent))",
              }}
            >
              <polyline
                points={chart.line}
                vectorEffect="non-scaling-stroke"
                style={{
                  fill: "none",
                  stroke: "var(--n-accent)",
                  strokeWidth: 2,
                  strokeLinejoin: "round",
                }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobilePreview() {
  return (
    <div
      className="lg:hidden mx-5 mt-10 h-80 overflow-hidden border border-b-0 border-(--n-neutral-800) rounded-t-[14px] bg-(--n-bg)"
      style={FADE_MASK("55%")}
    >
      <div className="flex items-center h-12 px-3.5 text-[15px] font-medium">
        Mes favoris
      </div>
      <div
        className="flex flex-col gap-px mx-2.5 rounded-lg overflow-hidden"
        style={{
          background: "color-mix(in srgb, var(--n-text) 7%, var(--n-surface))",
        }}
      >
        {previewFavorites.map((c, i) => (
          <div
            key={c.sym}
            className="grid grid-cols-[28px_minmax(0,1fr)_44px_auto] items-center gap-2.5 min-h-14 px-3"
            style={{
              background:
                i === 0
                  ? "color-mix(in srgb, var(--n-accent) 12%, var(--n-surface))"
                  : "var(--n-surface)",
              boxShadow: i === 0 ? "inset 2px 0 0 var(--n-accent)" : "none",
            }}
          >
            <span className="w-7 h-7 rounded-full grid place-items-center text-xs font-medium bg-(--n-neutral-800) text-(--n-neutral-200)">
              {c.mono}
            </span>
            <span className="flex flex-col leading-[1.3] min-w-0">
              <span className="text-[13px] font-medium">{c.name}</span>
              <span className="text-[11px] text-(--n-neutral-500)">
                {c.sym}
              </span>
            </span>
            <svg
              width="44"
              height="20"
              viewBox="0 0 100 32"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={c.spark}
                vectorEffect="non-scaling-stroke"
                style={{ fill: "none", stroke: trend(c.up), strokeWidth: 1.5 }}
              />
            </svg>
            <span className="n-tnum flex flex-col items-end leading-[1.3]">
              <span className="text-[13px] font-medium whitespace-nowrap">
                {c.priceF}
              </span>
              <span className="text-[11px]" style={{ color: trend(c.up) }}>
                {c.chgF}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPreview() {
  return (
    <div
      role="img"
      aria-label="Aperçu du dashboard Crypto-Explorer : favoris et graphique Bitcoin"
    >
      <DesktopPreview />
      <MobilePreview />
    </div>
  );
}
