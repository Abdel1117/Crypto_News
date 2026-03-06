"use client";

import React, { useMemo } from "react";
import type { CountDownProps, CountDownUnit, Labels } from "./types";
import { pad2 } from "./time";
import { useCountDown } from "./useCountDown";
import { AnimatedNumber } from "./AnimatedNumber";

export function CountDown({
  target,
  initialNowMs,
  onComplete,
  units = ["days", "hours", "minutes", "seconds"],
  labels,
  showSeparators = false,
  separator = <span className="px-2 text-foreground/60">:</span>,
  clampToZero = true,
  className,
  unitClassName,
  valueClassName,
  labelClassName,
  nowProvider,
}: CountDownProps) {
  const { parts } = useCountDown({
    target,
    clampToZero,
    onComplete,
    nowProvider,
    initialNowMs,
  });

  const resolvedLabels = useMemo(() => {
    const defaults: Required<Record<CountDownUnit, string>> = {
      days: "Days",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds",
    };

    const l: Labels = labels ?? {};
    return {
      days: l.days ?? defaults.days,
      hours: l.hours ?? defaults.hours,
      minutes: l.minutes ?? defaults.minutes,
      seconds: l.seconds ?? defaults.seconds,
    };
  }, [labels]);

  const items = units.map((u) => {
    const raw = parts[u];
    const value = u === "days" ? Math.abs(raw).toString() : pad2(raw);
    return { unit: u, value, label: resolvedLabels[u] };
  });

  return (
    <div
      className={["inline-flex flex-wrap flex-1  items-stretch", className]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((it, idx) => (
        <React.Fragment key={it.unit}>
          <div
            className={[
              "flex outline-1 min-w-18 flex-col items-center rounded-lg border border-white/10 bg-white/5 px-4 py-3",
              unitClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              className={[
                "text-3xl font-semibold text-foreground sm:text-4xl",
                valueClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <AnimatedNumber value={it.value} />
            </div>

            <div
              className={[
                "mt-1 text-xs uppercase tracking-wide text-foreground/70",
                labelClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {it.label}
            </div>
          </div>

          {showSeparators && idx < items.length - 1 ? (
            <div className="flex items-center">{separator}</div>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

export default CountDown;
