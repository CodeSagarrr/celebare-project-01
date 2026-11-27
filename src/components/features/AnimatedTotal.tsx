"use client";

import CountUp from "@/src/components/ui/CountUp";

export function AnimatedTotal({ amountPaise }: { amountPaise: number }) {
  return <CountUp to={amountPaise / 100} prefix="₹" separator="," decimals={2} duration={0.7} />;
}
