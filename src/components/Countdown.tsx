"use client";

import { useEffect, useState } from "react";

// Displays remaining time while leaving expiry decisions to the server.
export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}
