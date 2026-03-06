"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CountDownParts } from "./types";
import { getCountDownParts, toTimestampMs } from "./time";

type UseCountDownArgs = {
  target: Date | number | string;
  clampToZero: boolean;
  onComplete?: () => void;
  nowProvider?: () => number;
  initialNowMs?: number;
};

export function useCountDown({
  target,
  clampToZero,
  onComplete,
  nowProvider,
  initialNowMs,
}: UseCountDownArgs): {
  parts: CountDownParts;
  isComplete: boolean;
  diffMs: number;
} {
  const defaultNowProvider = useCallback(() => Date.now(), []);
  const effectiveNowProvider = nowProvider ?? defaultNowProvider;

  const targetMs = useMemo(() => toTimestampMs(target), [target]);
  const [nowMs, setNowMs] = useState<number>(() => {
    if (typeof initialNowMs === "number" && Number.isFinite(initialNowMs)) {
      return initialNowMs;
    }

    // Valeur déterministe pour que le SSR et le premier rendu client matchent.
    // Le vrai temps est appliqué dès le montage via useEffect.
    return Number.isFinite(targetMs) ? targetMs : 0;
  });
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [targetMs]);

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return;

    // Applique immédiatement l'heure réelle après hydration.
    // (évite un "flash" à 0 si initialNowMs n'est pas fourni)
    setNowMs(effectiveNowProvider());

    let intervalId: number | undefined;

    const tick = () => setNowMs(effectiveNowProvider());

    // Aligner sur la prochaine seconde (animation + précision visuelle)
    const msToNextSecond = 1000 - (effectiveNowProvider() % 1000);

    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 1000);
    }, msToNextSecond);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [targetMs, effectiveNowProvider]);

  const diffMs = targetMs - nowMs;

  const parts = useMemo(
    () => getCountDownParts(diffMs, clampToZero),
    [diffMs, clampToZero]
  );

  const isComplete =
    clampToZero &&
    parts.days === 0 &&
    parts.hours === 0 &&
    parts.minutes === 0 &&
    parts.seconds === 0;

  useEffect(() => {
    if (!isComplete) return;
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [isComplete, onComplete]);

  return { parts, isComplete, diffMs };
}
