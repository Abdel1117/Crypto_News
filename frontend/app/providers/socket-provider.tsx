"use client";

import { useEffect } from "react";
import { initSocket } from "@/app/lib/initSocket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSocket();
  }, []);

  return <>{children}</>;
}
