"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const prevUrl = useRef(pathname + searchParams.toString());

  useEffect(() => {
    const currentUrl = pathname + searchParams.toString();
    if (currentUrl === prevUrl.current) return;

    prevUrl.current = currentUrl;
    setState("loading");

    const timer = setTimeout(() => {
      setState("done");
      const cleanup = setTimeout(() => setState("idle"), 300);
      return () => clearTimeout(cleanup);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (state === "idle") return null;

  return <div className="top-loader" data-state={state} />;
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
