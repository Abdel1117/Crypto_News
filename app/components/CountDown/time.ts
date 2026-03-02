import type { CountDownParts } from "./types";

export function toTimestampMs(target: Date | number | string): number {
  if (target instanceof Date) return target.getTime();
  if (typeof target === "number") return target;

  const ms = new Date(target).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

export function getCountDownParts(
  diffMs: number,
  clampToZero: boolean
): CountDownParts {
  const sign = diffMs < 0 ? -1 : 1;
  const abs = Math.abs(diffMs);

  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (clampToZero && sign < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const parts = { days, hours, minutes, seconds };

  return sign < 0
    ? {
        days: -parts.days,
        hours: -parts.hours,
        minutes: -parts.minutes,
        seconds: -parts.seconds,
      }
    : parts;
}

export function pad2(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toString().padStart(2, "0");
  return n < 0 ? `-${s}` : s;
}
