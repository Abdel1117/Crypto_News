"use client";

import { useEffect, useRef } from "react";
import { createScope } from "animejs";

/**
 * Builds a section's animations. It runs inside an anime.js scope, so every
 * animation, split text and scroll observer it creates is reverted on unmount.
 */
export type MotionSetup = (root: HTMLElement) => void;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Plays a landing section's intro with anime.js.
 *
 * The root element carries `data-motion-root`. Elements marked
 * `data-motion-hide` (the root itself or descendants) are hidden by CSS before
 * hydration — see globals.css — so nothing flashes before the intro. This hook
 * then flags the root `data-motion-ready`, which lifts that CSS, and `setup`
 * hides what it animates in the same task, before the next paint.
 *
 * The intro is skipped and the content simply shown under reduced motion, or
 * when the CSS fallback already revealed it because the script came too late.
 */
export function useLandingMotion<T extends HTMLElement>(setup: MotionSetup) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const probe = root.matches("[data-motion-hide]")
      ? root
      : root.querySelector("[data-motion-hide]");
    const waiting = !!probe && getComputedStyle(probe).opacity === "0";
    const reduced = window.matchMedia?.(REDUCED_MOTION).matches ?? false;

    root.dataset.motionReady = "";
    const scope = waiting && !reduced ? createScope({ root }) : null;

    if (scope) {
      try {
        scope.add(() => setup(root));
      } catch (error) {
        // Drop any half-applied hidden state so the content stays visible.
        scope.revert();
        console.error("Landing animation failed", error);
      }
    }

    return () => {
      scope?.revert();
      delete root.dataset.motionReady;
    };
  }, [setup]);

  return ref;
}
