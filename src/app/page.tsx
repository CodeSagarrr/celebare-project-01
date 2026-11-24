import { db } from "@/src/lib/db";
import { PhotoGrid } from "@/src/components/PhotoGrid";

export const instant = false;

// Shows the seeded photographer and event catalog from the server database.
export default async function HomePage() {
  const photographers = await db.photographer.findMany({
    select: { id: true, name: true, events: { select: { id: true, name: true, pricePaise: true, photos: { select: { id: true, storageKey: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return <main className="page-shell">
    <header className="site-header"><a className="brand" href="/">frame<span>pay</span></a><nav><a href="/dashboard">Demo dashboard</a></nav></header>
    <section className="hero"><p className="eyebrow">Event photos · direct UPI</p><h1>Find your moment.</h1><p className="muted">Choose the photos you love, then pay directly to the photographer.</p></section>
    <PhotoGrid photographers={photographers} />
  </main>;
}
