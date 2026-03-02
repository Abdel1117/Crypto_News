"use client";

import React from "react";

export function AnimatedNumber({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  // Key sur la value => remount => animation à chaque tick
  return (
    <>
      <span
        key={value}
        className={["cd-tick inline-block tabular-nums", className]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>

      <style jsx>{`
        .cd-tick {
          animation: cdTick 220ms ease-out;
        }
        @keyframes cdTick {
          from {
            transform: translateY(-6px);
            opacity: 0.55;
            filter: blur(0.3px);
          }
          to {
            transform: translateY(0);
            opacity: 1;
            filter: blur(0);
          }
        }
      `}</style>
    </>
  );
}
