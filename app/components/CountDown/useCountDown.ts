"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CountDownParts } from "./types";
import { getCountDownParts, toTimestampMs } from "./time";

type UseCountDownArgs = {
  target: Date | number | string;
  clampToZero: boolean;
  onComplete?: () => void;
  nowProvider?: () => number;
};

export function useCountDown({
  target,
  clampToZero,
  onComplete,
  nowProvider = () => Date.now(),
}: UseCountDownArgs): {
  parts: CountDownParts;
  isComplete: boolean;
  diffMs: number;
} {
  const targetMs = useMemo(() => toTimestampMs(target), [target]);
  const [nowMs, setNowMs] = useState<number>(() => nowProvider());
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [targetMs]);

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return;

    let intervalId: number | undefined;

    const tick = () => setNowMs(nowProvider());

    // Aligner sur la prochaine seconde (animation + précision visuelle)
    const msToNextSecond = 1000 - (nowProvider() % 1000);

    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 1000);
    }, msToNextSecond);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [targetMs, nowProvider]);

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
