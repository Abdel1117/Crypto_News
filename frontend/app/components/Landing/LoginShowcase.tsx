import {
  LightningIcon,
  ShieldCheckIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";
import { previewFavorites } from "./previewData";

const trend = (up: boolean) => (up ? "var(--n-up)" : "var(--n-down)");

// Right-hand panel of the login page: shows what you get once signed in.
export default function LoginShowcase() {
  return (
    <aside
      className="relative hidden lg:flex flex-col justify-center gap-10 px-24 py-[72px]"
      style={{
        background:
          "radial-gradient(900px 640px at 85% -10%, color-mix(in srgb, var(--n-accent-900) 85%, transparent), transparent 62%), color-mix(in srgb, var(--n-surface) 30%, var(--n-bg))",
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--n-divider) 48px, var(--n-divider) calc(100% - 48px), transparent)",
        }}
      />
      <h2 className="m-0 max-w-[14ch] text-[44px] leading-[1.1]">
        Connectez-vous ou créez votre compte
      </h2>

      <div
        className="w-[460px] max-w-full py-1.5 rounded-[14px] bg-(--n-surface)"
        style={{ boxShadow: "var(--n-shadow-md)" }}
        role="img"
        aria-label="Aperçu de vos favoris : Bitcoin, Ethereum, Solana, Dogecoin"
      >
        <div className="flex items-center gap-2 px-[18px] pt-3 pb-2">
          <span className="mr-auto text-sm font-medium">Mes favoris</span>
          <span className="w-1.5 h-1.5 rounded-full bg-(--n-up)" />
          <span className="text-xs text-(--n-neutral-400)">En direct</span>
        </div>
        {previewFavorites.map((c) => (
          <div
            key={c.sym}
            className="relative grid grid-cols-[30px_minmax(0,1fr)_64px_112px] items-center gap-3 min-h-14 px-[18px]"
          >
            <div className="n-rule" />
            <span className="w-[30px] h-[30px] rounded-full grid place-items-center text-xs font-medium bg-(--n-neutral-800) text-(--n-neutral-200)">
              {c.mono}
            </span>
            <span className="flex flex-col leading-[1.3]">
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs text-(--n-neutral-500)">{c.sym}</span>
            </span>
            <svg
              width="64"
              height="24"
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
              <span className="text-sm font-medium whitespace-nowrap">
                {c.priceF}
              </span>
              <span className="text-xs" style={{ color: trend(c.up) }}>
                {c.chgF}
              </span>
            </span>
          </div>
        ))}
      </div>

      <ul className="flex flex-col gap-3.5 m-0 p-0 list-none text-[15px] text-(--n-neutral-300)">
        <li className="flex items-center gap-3">
          <LightningIcon size={20} className="text-(--n-accent)" />
          Accès rapide à votre dashboard et à vos favoris.
        </li>
        <li className="flex items-center gap-3">
          <ShieldCheckIcon size={20} className="text-(--n-accent)" />
          Inscription sécurisée et fluide.
        </li>
      </ul>
    </aside>
  );
}
