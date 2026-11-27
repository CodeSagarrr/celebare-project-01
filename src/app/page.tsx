import { PublicSearch } from "@/src/components/features/PublicSearch";
import { SiteHeader } from "@/src/components/features/site-header";
import { listPhotographerCatalog } from "@/src/modules/photographers/photographer.service";
import Link from "next/link";

export const instant = false;

// Shows the seeded photographer and event catalog from the server database.
export default async function HomePage() {
  const photographers = await listPhotographerCatalog();
  return <main className="page-shell">
    <SiteHeader><Link href="/login">Photographer login</Link></SiteHeader>
    <section className="hero"><p className="eyebrow">Event photos · direct UPI</p><h1>Find your moment.</h1><p className="muted">Choose the photos you love, then pay directly to the photographer.</p></section>
    <PublicSearch photographers={photographers} />
  </main>;
}
