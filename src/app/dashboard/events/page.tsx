import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import { listPhotographerEvents } from "@/src/modules/events/event.service";
import { EventManager } from "@/src/components/EventManager";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/src/components/features/site-header";

async function EventWorkspace() {
  await connection();
  const session = await auth();
  if (!session?.user.photographerId) redirect("/login");
  const events = await listPhotographerEvents(session.user.photographerId);
  return <EventManager initialEvents={events} />;
}

function EventWorkspaceFallback() {
  return <section className="card" aria-busy="true" aria-live="polite"><h2>Loading events</h2><p className="muted">Your events and upload controls are loading.</p></section>;
}

export default function PhotographerEventsPage() {
  return (
    <main className="page-shell narrow">
      <SiteHeader><Link href="/dashboard">Dashboard</Link></SiteHeader>
      <section className="hero compact"><p className="eyebrow">Photographer workspace</p><h1>Events and photos</h1><p className="muted">Create an event, then upload JPEG, PNG, or WebP photos up to 10 MB each.</p></section>
      <Suspense fallback={<EventWorkspaceFallback />}><EventWorkspace /></Suspense>
    </main>
  );
}
