"use client";

import React, { useEffect, useState } from "react";
import { CountDown } from "@/app/components/CountDown/CountDown";

export function HeroCountDown() {
  const [targetMs, setTargetMs] = useState<number>(0);
  const [initialNowMs, setInitialNowMs] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const now = Date.now();
    setInitialNowMs(now);
    setTargetMs(now + 8000000000);
  }, []);

  return (
    <CountDown
      target={targetMs}
      initialNowMs={initialNowMs}
      className="gap-3"
      unitClassName="bg-black/30"
      valueClassName="text-5xl"
      labelClassName="text-[10px]"
    />
  );
}
