import type { ReactNode } from "react";
import { Suspense } from "react";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SiteHeader } from "@/src/components/features/site-header";

async function DashboardGuard({ children }: { children: ReactNode }) {
  await connection();
  const session = await auth();
  if (!session?.user.photographerId) redirect("/login");
  return children;
}

function DashboardFallback() {
  return (
    <main className="page-shell" aria-busy="true">
      <SiteHeader />
      <section className="hero compact" aria-live="polite">
        <p className="eyebrow">Photographer workspace</p>
        <h1>Loading dashboard</h1>
        <p className="muted">Your workspace is loading.</p>
      </section>
    </main>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardGuard>{children}</DashboardGuard>
    </Suspense>
  );
}
