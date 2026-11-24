"use client";

import { useEffect, useState } from "react";

// Displays remaining time while leaving expiry decisions to the server.
export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));

  useEffect(() => {
    // Keeps the display current without changing the server-owned order status.
    const timer = window.setInterval(() => {
      setSeconds(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}
