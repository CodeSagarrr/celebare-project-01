import type { ReactNode } from "react";
import { QueryProvider } from "@/src/components/QueryProvider";
import "./globals.css";

export const metadata = { title: "Framepay · event photos", description: "Choose event photos and pay the photographer directly with UPI." };

// Provides shared metadata and the minimal app shell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><QueryProvider>{children}</QueryProvider></body></html>;
}
