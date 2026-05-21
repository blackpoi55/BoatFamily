"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push";

export function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    void registerServiceWorker();
  }, []);
  return null;
}
