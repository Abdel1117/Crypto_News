"use client";

import { useState, useSyncExternalStore } from "react";
import { useCountDown } from "../CountDown/useCountDown";
import { pad2 } from "../CountDown/time";
import { AnimatedNumber } from "../CountDown/AnimatedNumber";

const BETA_CURRENT = 450000;
const BETA_GOAL = 900000;
// Same rolling deadline as the previous hero countdown.
const BETA_DURATION_MS = 8000000000;

const fmt = (n: number) => n.toLocaleString("fr-FR");

// The deadline is fixed the first time the client reads it, then kept for the
// session. The server snapshot is null so SSR renders placeholders.
let clientTargetMs: number | null = null;
const getTargetMs = () => (clientTargetMs ??= Date.now() + BETA_DURATION_MS);
const getServerTargetMs = () => null;
const noopSubscribe = () => () => {};

const LABELS = ["Jours", "Heures", "Minutes", "Secondes"];

function CountDownGrid({ values }: { values: string[] }) {
  return (
    <div className="n-tnum grid grid-cols-4 gap-2 lg:gap-0 lg:grid-cols-[repeat(4,auto)] lg:justify-between">
      {LABELS.map((label, i) => (
        <div key={label}>
          <p className="m-0 text-[36px] lg:text-[60px] leading-none font-medium tracking-[-0.02em]">
            <AnimatedNumber value={values[i]} />
          </p>
          <p className="mt-2.5 lg:mt-3.5 text-[11px] lg:text-[13px] tracking-[0.06em] uppercase text-[color-mix(in_srgb,var(--n-text)_70%,transparent)]">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function LiveCountDown({ target }: { target: number }) {
  // Only rendered client-side, so reading the clock here is hydration-safe.
  const [initialNowMs] = useState(() => Date.now());
  const { parts } = useCountDown({ target, clampToZero: true, initialNowMs });
  return (
    <CountDownGrid
      values={[parts.days, parts.hours, parts.minutes, parts.seconds].map(pad2)}
    />
  );
}

function BetaCountDown() {
  const target = useSyncExternalStore(
    noopSubscribe,
    getTargetMs,
    getServerTargetMs,
  );
  if (target === null)
    return <CountDownGrid values={["--", "--", "--", "--"]} />;
  return <LiveCountDown target={target} />;
}

export default function BetaBand() {
  const percent = (BETA_CURRENT / BETA_GOAL) * 100;

  return (
    <section
      className="n-force-dark text-(--n-text) bg-[radial-gradient(500px_300px_at_90%_-30%,color-mix(in_srgb,var(--n-section-glow)_70%,transparent),transparent_64%),var(--n-section)] lg:bg-[radial-gradient(900px_420px_at_85%_-40%,color-mix(in_srgb,var(--n-section-glow)_70%,transparent),transparent_64%),var(--n-section)]"
      aria-labelledby="beta-title"
    >
      <div className="mx-auto max-w-[1440px] grid gap-7 px-5 py-11 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-24 lg:gap-y-6 lg:items-end lg:px-[120px] lg:py-[68px]">
        <h2
          id="beta-title"
          className="m-0 text-[26px] lg:text-[32px] lg:col-start-1 lg:row-start-1"
        >
          Accès bêta
        </h2>
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-end">
          <BetaCountDown />
        </div>
        <div className="flex flex-col gap-2.5 lg:gap-3 lg:col-start-1 lg:row-start-2">
          <div className="n-tnum flex justify-between gap-3 lg:gap-4 text-[13px] lg:text-sm">
            <span>Accès bêta activés</span>
            <span className="text-[color-mix(in_srgb,var(--n-text)_72%,transparent)]">
              {fmt(BETA_CURRENT)} / {fmt(BETA_GOAL)}
              <span className="hidden lg:inline"> utilisateurs</span>
            </span>
          </div>
          <div
            className="relative h-0.5 bg-[color-mix(in_srgb,var(--n-text)_18%,transparent)]"
            role="progressbar"
            aria-label="Accès bêta activés"
            aria-valuemin={0}
            aria-valuemax={BETA_GOAL}
            aria-valuenow={BETA_CURRENT}
          >
            <div
              className="absolute inset-y-0 left-0 bg-(--n-accent-300) shadow-[0_0_10px_var(--n-accent-400)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
